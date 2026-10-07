// Stage 2 of the Circle email-wallet connector: eth_sendTransaction.
//
// The flow proven by scripts/circle-tx-hash-probe.mjs:
//   1. server: create a contract-execution challenge (to + calldata)
//   2. browser: sdk.setAuthentication + sdk.execute(challengeId) -> Circle's
//      secure screen, where the user approves (in confirm-only mode that's a
//      Confirm button; PIN-configured accounts enter their PIN there)
//   3. server: poll the challenge until COMPLETE -> correlationIds[0] is the
//      Circle transaction id
//   4. server: poll that transaction until COMPLETE -> txHash
//   5. return txHash to wagmi (which then waits for the receipt as usual)
//
// Status always comes from polling the server; the SDK's completion callback
// is only used to notice an early cancel / error (it's unreliable for
// success), and hostedScreen.ts detects a screen that never opens. The hash is returned once Circle reports the transaction
// COMPLETE, not merely SENT: the on-chain hash is the bundler's wrapper
// transaction, which can succeed even if the wallet's own call reverted,
// so Circle's state is what tells success from failure.
//
// Browser-only at call time. The SDK is loaded lazily with a dynamic import
// (exactly like /signup) so it never enters the SSR bundle.
import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { formatUnits } from "viem";
import { arcTestnet, USDC_ADDRESS } from "@/lib/wagmi";
import { HostedScreenTimeoutError, watchHostedScreen } from "./hostedScreen";
import { getValidUserToken, refreshEmailSession } from "./session";
import { readEmailSession } from "./storage";
import { createCircleContractExecution, getCircleChallenge, getCircleTransaction } from "./transactions";

const LOG_TAG = "[EmailSigner]";
const log = (...args: unknown[]) => console.log(LOG_TAG, ...args);

/** How long we wait for the user to approve on Circle's screen. */
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;
/** How long we wait for Circle to land the transaction after approval. */
const TX_TIMEOUT_MS = 3 * 60 * 1000;
const POLL_MS = 1500;
/** Consecutive status-read failures tolerated before giving up. */
const MAX_POLL_ERRORS = 5;

// Circle Web SDK error codes we translate (from the SDK's ErrorCode enum).
// The PIN messages only apply to accounts Circle configured with a PIN; for
// confirm-only accounts Circle never returns them.
const SDK_USER_CANCELED = 155701;
// Circle's screen couldn't decrypt the challenge with the encryptionKey we
// passed: the key is empty or isn't the one Circle holds for this userToken.
const SDK_INVALID_ENCRYPTION_KEY = 155118;
const SDK_PIN_ERRORS: Record<number, string> = {
  155112: "Incorrect PIN.",
  155119: "Your PIN is locked after too many attempts. Reset it with your security questions, then try again.",
  155703: "The PINs didn't match.",
};

/**
 * EIP-1193-shaped error so wagmi/viem classify it: 4001 = user rejected
 * (useLockUsdc shows "Transaction cancelled"), 4100 = unauthorized,
 * -32603 = internal error. The message is the specific reason.
 */
export class EmailTransactionError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = "EmailTransactionError";
    this.code = code;
  }
}

/** Circle's screen rejected our encryptionKey (155118) before the user could approve. */
class EncryptionKeyRejectedError extends EmailTransactionError {
  constructor() {
    super(-32603, "Invalid encryption key");
    this.name = "EncryptionKeyRejectedError";
  }
}

export interface EmailTxRequest {
  from?: string;
  to?: string;
  data?: string;
  value?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// One SDK instance for the page, created on the first send and reused for
// every later approval (approve + lock = two Circle screens on one instance).
let sdkPromise: Promise<W3SSdk> | null = null;

export function getCircleSigningSdk(): Promise<W3SSdk> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Circle signing runs in the browser only"));
  }
  sdkPromise ??= (async () => {
    // Same order as /signup: install the process shim BEFORE importing the
    // SDK (its CJS dependency chain needs `process`). Invoked as a function so
    // tree-shaking can't drop it (see src/lib/process-shim.ts).
    const { installProcessShim } = await import("@/lib/process-shim");
    installProcessShim();
    const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
    const appId = import.meta.env.VITE_CIRCLE_APP_ID as string | undefined;
    if (!appId) throw new Error("VITE_CIRCLE_APP_ID is not set");
    return new W3SSdk({ appSettings: { appId } });
  })();
  return sdkPromise.catch((err) => {
    sdkPromise = null; // allow a retry after a failed load
    throw err;
  });
}

// Strictly one transaction at a time: a second send (e.g. lock after
// approve) can't open a Circle screen while the first is still in flight.
let queue: Promise<unknown> = Promise.resolve();

export function sendEmailTransaction(tx: EmailTxRequest): Promise<`0x${string}`> {
  const run = queue
    .then(
      () => runEmailTransaction(tx),
      () => runEmailTransaction(tx),
    )
    .catch((err: unknown) => {
      // The calling hook may only show a generic message; keep the real
      // reason visible in the console (never includes tokens).
      console.warn(LOG_TAG, "transaction not sent:", err instanceof Error ? err.message : err);
      throw err;
    });
  queue = run.catch(() => undefined);
  return run;
}

async function runEmailTransaction(tx: EmailTxRequest): Promise<`0x${string}`> {
  const session = readEmailSession();
  if (!session) throw new EmailTransactionError(4100, "No email session — log in with email again.");
  if (tx.from && tx.from.toLowerCase() !== session.address.toLowerCase()) {
    throw new EmailTransactionError(4100, "This transaction isn't from the connected email wallet.");
  }
  if (!tx.to) throw new EmailTransactionError(-32603, "Contract deployment isn't supported for email wallets.");
  if (tx.value && BigInt(tx.value) !== 0n) {
    throw new EmailTransactionError(-32603, "Sending native USDC value isn't supported for email wallets.");
  }

  void logWalletFunds(session.address);

  try {
    return await attemptEmailTransaction(tx, await getSigningAuth());
  } catch (err) {
    if (!(err instanceof EncryptionKeyRejectedError)) throw err;
    // The stored encryptionKey no longer matches what Circle holds for this
    // session. Get a new userToken + encryptionKey pair from Circle and try
    // once more with a new challenge (nothing was signed: the screen failed
    // before the user could approve).
    log("Circle rejected the stored encryptionKey (155118) — refreshing the session and retrying once");
    const outcome = await refreshEmailSession();
    log("session refresh:", outcome);
    if (outcome !== "refreshed") {
      throw new EmailTransactionError(4100, "Your email session is out of date — log in with email again.");
    }
    try {
      return await attemptEmailTransaction(tx, await getSigningAuth());
    } catch (retryErr) {
      if (retryErr instanceof EncryptionKeyRejectedError) {
        throw new EmailTransactionError(
          4100,
          "Circle rejected this session's encryption key — log out and log in with email again.",
        );
      }
      throw retryErr;
    }
  }
}

interface SigningAuth {
  userToken: string;
  encryptionKey: string;
  walletId: string;
}

/**
 * userToken + encryptionKey for one transaction, taken from ONE session
 * snapshot so they're always the pair Circle issued together (login or the
 * same refresh). Refreshes first if the token is near expiry.
 */
async function getSigningAuth(): Promise<SigningAuth> {
  const token = await getValidUserToken();
  const s = readEmailSession();
  if (!token || !s) throw new EmailTransactionError(4100, "Your email session expired — log in with email again.");
  if (!s.encryptionKey) throw new EmailTransactionError(4100, "Your email session is incomplete — log in with email again.");
  // Diagnostics without secrets: whether the token we were handed is the
  // stored one, and how old that pair is.
  log("signing with stored session pair", {
    tokenMatchesStored: token === s.userToken,
    pairAgeMinutes: Math.round((Date.now() - s.issuedAt) / 60000),
  });
  return { userToken: s.userToken, encryptionKey: s.encryptionKey, walletId: s.walletId };
}

async function attemptEmailTransaction(tx: EmailTxRequest, auth: SigningAuth): Promise<`0x${string}`> {
  const { userToken } = auth;

  // 1. challenge
  log("eth_sendTransaction -> creating Circle challenge", { to: tx.to, selector: tx.data?.slice(0, 10) });
  const created = await createCircleContractExecution({
    data: {
      userToken,
      walletId: auth.walletId,
      contractAddress: tx.to!,
      callData: tx.data ?? "0x",
      refId: `oinkai-${Date.now()}`,
    },
  });
  if (!created.ok) {
    throw new EmailTransactionError(-32603, `Circle couldn't prepare the transaction: ${created.message}`);
  }
  const { challengeId } = created;
  log("challenge created", challengeId);

  // 2. Circle's secure screen (approve / confirm), authenticated with the
  // same userToken + encryptionKey pair that created the challenge.
  const sdk = await getCircleSigningSdk();
  sdk.setAuthentication({ userToken, encryptionKey: auth.encryptionKey });
  let sdkError: { code?: number; message: string } | null = null;
  // Diagnostics: which keys Circle's iframe posts (e.g. whether clicking
  // Confirm sends anything back at all). Key names only, never values.
  const watch = watchHostedScreen(undefined, (keys) => log("Circle screen message:", keys.join(",")));
  sdk.execute(challengeId, (err, result) => {
    log("sdk.execute callback", {
      errorCode: (err as { code?: number } | undefined)?.code ?? null,
      errorMessage: err?.message ?? null,
      resultType: (result as { type?: string } | undefined)?.type ?? null,
      resultStatus: (result as { status?: string } | undefined)?.status ?? null,
    });
    if (err) sdkError = { code: (err as { code?: number }).code, message: err.message };
  });
  log("opening Circle's secure screen (sdk.execute)");

  let transactionId: string;
  try {
    // Circle has to actually show its screen (or finish) within the timeout;
    // otherwise fail loudly instead of waiting out APPROVAL_TIMEOUT_MS.
    await watch.opened.catch((err: unknown) => {
      if (err instanceof HostedScreenTimeoutError) {
        throw new EmailTransactionError(-32603, "Circle's secure screen didn't open. Please try again.");
      }
      throw err;
    });
    log("Circle's secure screen is open — waiting for the user to approve");

    // 3. challenge -> transaction id
    transactionId = await waitForChallenge(userToken, challengeId, () => sdkError, watch.closed);
  } finally {
    watch.stop();
  }
  log("approved on Circle's screen; Circle transaction", transactionId);

  // 4. transaction -> hash
  const txHash = await waitForTransaction(userToken, transactionId);
  log("transaction complete", txHash);
  return txHash;
}

async function waitForChallenge(
  userToken: string,
  challengeId: string,
  sdkError: () => { code?: number; message: string } | null,
  screenClosed: () => boolean,
): Promise<string> {
  const started = Date.now();
  const deadline = started + APPROVAL_TIMEOUT_MS;
  let errors = 0;
  let sdkErrorSeen = false;
  for (let poll = 1; ; poll++) {
    // Diagnostics: one line per poll, plus a warning if a status request hangs.
    const sentAt = Date.now();
    const slow = window.setTimeout(() => log(`challenge poll #${poll}: request still pending after 10s`), 10_000);
    const res = await getCircleChallenge({ data: { userToken, challengeId } })
      .catch((e: unknown) => ({
        ok: false as const,
        code: 0,
        status: 0,
        message: e instanceof Error ? e.message : String(e),
      }))
      .finally(() => window.clearTimeout(slow));
    log(
      `challenge poll #${poll} (+${Math.round((Date.now() - started) / 1000)}s, ${Date.now() - sentAt}ms):`,
      res.ok
        ? { status: res.status, correlationIds: res.correlationIds.length, errorCode: res.errorCode ?? null, errorMessage: res.errorMessage ?? null }
        : { requestFailed: res.message, code: res.code, httpStatus: res.status },
      { screenClosed: screenClosed(), sdkError: sdkError()?.code ?? null },
    );
    if (res.ok) {
      errors = 0;
      if (res.status === "COMPLETE" && res.correlationIds[0]) return res.correlationIds[0];
      if (res.status === "FAILED") {
        throw new EmailTransactionError(-32603, `Circle rejected the transaction: ${res.errorMessage ?? `error ${res.errorCode ?? "unknown"}`}`);
      }
      if (res.status === "EXPIRED") throw new EmailTransactionError(-32603, "The approval request expired. Please try again.");
    } else if (++errors >= MAX_POLL_ERRORS) {
      throw new EmailTransactionError(-32603, `Couldn't check the transaction status with Circle: ${res.message}`);
    }

    // The SDK reported an error, or the user closed Circle's screen, and the
    // server still isn't COMPLETE (checked once more after first noticing it):
    // the user cancelled or approval failed.
    const e = sdkError();
    if (e?.code === SDK_INVALID_ENCRYPTION_KEY) throw new EncryptionKeyRejectedError();
    if (e || screenClosed()) {
      if (sdkErrorSeen) {
        if (!e || e.code === SDK_USER_CANCELED) throw new EmailTransactionError(4001, "User rejected the request.");
        throw new EmailTransactionError(-32603, (e.code && SDK_PIN_ERRORS[e.code]) || e.message || "Approval on Circle's screen failed.");
      }
      sdkErrorSeen = true;
    }

    if (Date.now() > deadline) {
      throw new EmailTransactionError(4001, "Timed out waiting for approval on Circle's screen — the transaction was not sent.");
    }
    await sleep(POLL_MS);
  }
}

async function waitForTransaction(userToken: string, transactionId: string): Promise<`0x${string}`> {
  const deadline = Date.now() + TX_TIMEOUT_MS;
  let errors = 0;
  for (;;) {
    const res = await getCircleTransaction({ data: { userToken, transactionId } }).catch((e: unknown) => ({
      ok: false as const,
      code: 0,
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    }));
    if (res.ok) {
      errors = 0;
      if (res.state === "COMPLETE" && res.txHash) return res.txHash as `0x${string}`;
      if (res.state === "FAILED" || res.state === "DENIED" || res.state === "CANCELLED") {
        throw new EmailTransactionError(-32603, `Transaction ${res.state.toLowerCase()}: ${res.errorReason ?? "no reason given"}`);
      }
    } else if (++errors >= MAX_POLL_ERRORS) {
      throw new EmailTransactionError(-32603, `Couldn't check the transaction status with Circle: ${res.message}`);
    }
    if (Date.now() > deadline) {
      throw new EmailTransactionError(-32603, "Circle didn't finish the transaction in time. Check your history before retrying.");
    }
    await sleep(POLL_MS);
  }
}

// Diagnostics: the wallet's native USDC (gas) and ERC-20 USDC balances, read
// from the public Arc RPC. Public data only.
async function logWalletFunds(address: string): Promise<void> {
  try {
    const rpc = arcTestnet.rpcUrls.default.http[0];
    const call = async (method: string, params: unknown[]) => {
      const r = await fetch(rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      return ((await r.json()) as { result?: string }).result ?? "0x0";
    };
    const padded = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const [native, erc20] = await Promise.all([
      call("eth_getBalance", [address, "latest"]),
      call("eth_call", [{ to: USDC_ADDRESS, data: `0x70a08231${padded}` }, "latest"]),
    ]);
    log("wallet funds", {
      address,
      nativeUsdc: formatUnits(BigInt(native), 18),
      erc20Usdc: formatUnits(BigInt(erc20), 6),
    });
  } catch (err) {
    log("wallet funds: couldn't read", err instanceof Error ? err.message : err);
  }
}
