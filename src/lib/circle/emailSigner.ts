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
import { HostedScreenTimeoutError, watchHostedScreen } from "./hostedScreen";
import { getValidUserToken } from "./session";
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

  const userToken = await getValidUserToken();
  if (!userToken) throw new EmailTransactionError(4100, "Your email session expired — log in with email again.");

  // 1. challenge
  log("eth_sendTransaction -> creating Circle challenge", { to: tx.to, selector: tx.data?.slice(0, 10) });
  const created = await createCircleContractExecution({
    data: {
      userToken,
      walletId: session.walletId,
      contractAddress: tx.to,
      callData: tx.data ?? "0x",
      refId: `oinkai-${Date.now()}`,
    },
  });
  if (!created.ok) {
    throw new EmailTransactionError(-32603, `Circle couldn't prepare the transaction: ${created.message}`);
  }
  const { challengeId } = created;
  log("challenge created", challengeId);

  // 2. Circle's secure screen (approve / confirm)
  const sdk = await getCircleSigningSdk();
  const latest = readEmailSession(); // pick up an encryptionKey rotated by a refresh
  if (!latest) throw new EmailTransactionError(4100, "Your email session ended — log in with email again.");
  sdk.setAuthentication({ userToken, encryptionKey: latest.encryptionKey });
  let sdkError: { code?: number; message: string } | null = null;
  const watch = watchHostedScreen();
  sdk.execute(challengeId, (err) => {
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
  const deadline = Date.now() + APPROVAL_TIMEOUT_MS;
  let errors = 0;
  let sdkErrorSeen = false;
  for (;;) {
    const res = await getCircleChallenge({ data: { userToken, challengeId } }).catch((e: unknown) => ({
      ok: false as const,
      code: 0,
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    }));
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
