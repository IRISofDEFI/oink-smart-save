// PROTOTYPE — not wired into the app. Proves the server half of getting an
// on-chain tx hash for a Circle User-Controlled Wallet contract call:
//
//   1. POST /v1/w3s/user/transactions/contractExecution  -> { challengeId }
//   2. (BROWSER) sdk.setAuthentication({ userToken, encryptionKey });
//                sdk.execute(challengeId, cb)            -> user enters PIN
//   3. GET  /v1/w3s/user/challenges/{challengeId}         -> correlationIds[0] = transaction id
//   4. GET  /v1/w3s/transactions/{transactionId}          -> state, txHash
//   5. (optional) eth_getTransactionReceipt on Arc RPC    -> confirms the hash is real
//
// Step 2 needs Circle's PIN UI (an iframe the Web SDK opens), so it cannot
// run from Node. This script stops there and prints what the browser must do.
//
// Usage (from the repo root; CIRCLE_API_KEY is read from .env.local):
//   USER_TOKEN=... WALLET_ID=... node scripts/circle-tx-hash-probe.mjs create
//   USER_TOKEN=... node scripts/circle-tx-hash-probe.mjs poll <challengeId>
//   USER_TOKEN=... WALLET_ID=... node scripts/circle-tx-hash-probe.mjs recent
//
// The probe call is USDC approve(0x…dEaD, 0): it sets a zero allowance for a
// burn address, so it changes nothing meaningful on-chain. It still costs gas
// (sponsored or not — the result tells us which).
import { randomUUID } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "https://api.circle.com/v1/w3s";
const ARC_RPC = process.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";
const USDC = "0x3600000000000000000000000000000000000000";
const BURN = "0x000000000000000000000000000000000000dEaD";

const API_KEY = process.env.CIRCLE_API_KEY;
const USER_TOKEN = process.env.USER_TOKEN;
const WALLET_ID = process.env.WALLET_ID;

const TERMINAL_CHALLENGE = new Set(["COMPLETE", "FAILED", "EXPIRED"]);
// From the Get-a-Transaction schema. COMPLETE/CONFIRMED carry a txHash; the
// failure states may or may not, and FAILED carries errorReason.
const TERMINAL_TX = new Set(["COMPLETE", "FAILED", "DENIED", "CANCELLED"]);

function need(name, value) {
  if (!value) {
    console.error(`Missing ${name}. See the usage notes at the top of this file.`);
    process.exit(1);
  }
}

async function circle(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "X-User-Token": USER_TOKEN,
      "X-Request-Id": randomUUID(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new Error(`${method} ${path} -> HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json?.data ?? json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString().slice(11, 19);

async function create() {
  need("WALLET_ID", WALLET_ID);
  const refId = `oink-probe-${Date.now()}`;
  const { challengeId } = await circle("/user/transactions/contractExecution", {
    method: "POST",
    body: {
      idempotencyKey: randomUUID(),
      walletId: WALLET_ID,
      contractAddress: USDC,
      abiFunctionSignature: "approve(address,uint256)",
      abiParameters: [BURN, "0"],
      feeLevel: "MEDIUM",
      refId,
    },
  });
  console.log(`challengeId: ${challengeId}`);
  console.log(`refId:       ${refId}`);

  // What does the challenge look like BEFORE the PIN? (Expected: PENDING, and
  // possibly no correlationIds yet — this run tells us.)
  const before = await circle(`/user/challenges/${challengeId}`);
  console.log("challenge before PIN:", JSON.stringify(before.challenge ?? before));

  console.log(`
── Browser half (cannot run from Node) ─────────────────────────────────────
In a page that has the Circle Web SDK loaded for this app (VITE_CIRCLE_APP_ID):
  sdk.setAuthentication({ userToken, encryptionKey });
  sdk.execute("${challengeId}", (err, result) => console.log(err, result));
The user enters their PIN; the callback only gets { type, status }.

── Then run the server half ────────────────────────────────────────────────
  USER_TOKEN=... node scripts/circle-tx-hash-probe.mjs poll ${challengeId}
`);
}

async function poll(challengeId) {
  need("challengeId argument", challengeId);

  // Step 3: challenge -> transaction id
  let challenge;
  for (let i = 0; i < 120; i++) {
    const data = await circle(`/user/challenges/${challengeId}`);
    challenge = data.challenge ?? data;
    console.log(`[${now()}] challenge status=${challenge.status} correlationIds=${JSON.stringify(challenge.correlationIds ?? [])}`);
    if (TERMINAL_CHALLENGE.has(challenge.status) && challenge.correlationIds?.length) break;
    if (challenge.status === "FAILED" || challenge.status === "EXPIRED") break;
    await sleep(2000);
  }
  if (challenge.status !== "COMPLETE") {
    console.log(`Challenge ended as ${challenge.status} (${challenge.errorCode ?? ""} ${challenge.errorMessage ?? ""}). No transaction.`);
    return;
  }
  const transactionId = challenge.correlationIds?.[0];
  if (!transactionId) {
    console.log("Challenge COMPLETE but correlationIds is empty — fall back to `recent` to match by refId.");
    return;
  }

  // Step 4: transaction id -> state + txHash
  let tx;
  for (let i = 0; i < 180; i++) {
    const data = await circle(`/transactions/${transactionId}`);
    tx = data.transaction ?? data;
    console.log(`[${now()}] tx state=${tx.state} txHash=${tx.txHash ?? "-"}${tx.errorReason ? ` errorReason=${tx.errorReason}` : ""}`);
    if (TERMINAL_TX.has(tx.state)) break;
    await sleep(2000);
  }
  console.log("final transaction record:", JSON.stringify(tx, null, 2));

  // Step 5: the hash wagmi would wait on — does Arc know it?
  if (tx.txHash) {
    const res = await fetch(ARC_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [tx.txHash] }),
    }).then((r) => r.json());
    const r = res.result;
    console.log(
      r
        ? `on-chain receipt: status=${r.status} block=${parseInt(r.blockNumber, 16)} from=${r.from} to=${r.to} logs=${r.logs.length}`
        : "on-chain receipt: not found (yet)",
    );
  }
}

// Fallback / sanity check: newest contract executions for the wallet, so the
// refId printed by `create` can be matched client-side (the list endpoint has
// no refId or challengeId filter).
async function recent() {
  need("WALLET_ID", WALLET_ID);
  const data = await circle(
    `/transactions?walletIds=${WALLET_ID}&operation=CONTRACT_EXECUTION&order=DESC&pageSize=5`,
  );
  for (const t of data.transactions ?? []) {
    console.log(`${t.createDate} id=${t.id} state=${t.state} refId=${t.refId ?? "-"} txHash=${t.txHash ?? "-"}${t.errorReason ? ` errorReason=${t.errorReason}` : ""}`);
  }
}

need("CIRCLE_API_KEY (in .env.local)", API_KEY);
need("USER_TOKEN", USER_TOKEN);

const [cmd, arg] = process.argv.slice(2);
const run = { create, poll: () => poll(arg), recent }[cmd];
if (!run) {
  console.error("Usage: create | poll <challengeId> | recent  (see top of file)");
  process.exit(1);
}
run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
