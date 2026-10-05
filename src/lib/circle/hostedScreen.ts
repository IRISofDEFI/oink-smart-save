// Watches Circle's hosted screen (the pw-auth iframe opened by sdk.execute).
//
// Why: sdk.execute() appends Circle's iframe HIDDEN and only reveals it when
// Circle's service posts `showUi`. The SDK's own 10-second "no response"
// timeout is keyed on a flag that is never reset, so on an SDK instance that
// already talked to Circle (e.g. the /signup instance after the device-id and
// OTP steps) a screen that never appears produces no error at all — the page
// just waits forever. This watcher gives callers their own signal.
//
// It reads only which message keys Circle sends, never their contents.
const CIRCLE_ORIGIN = /^https:\/\/[a-z0-9.-]*circle\.com$/i;

/** How long Circle gets to actually show its screen after sdk.execute(). */
export const SCREEN_OPEN_TIMEOUT_MS = 20_000;

export interface HostedScreenWatch {
  /** Resolves once Circle shows its screen (or finishes without needing to). */
  opened: Promise<"shown" | "finished">;
  /** True once the user closed Circle's screen without finishing. */
  closed: () => boolean;
  stop: () => void;
}

export class HostedScreenTimeoutError extends Error {
  constructor() {
    super("Circle's secure screen didn't open. Please try again.");
    this.name = "HostedScreenTimeoutError";
  }
}

/**
 * Start watching BEFORE calling sdk.execute(). `opened` rejects with
 * HostedScreenTimeoutError if Circle neither shows its screen nor finishes
 * within `timeoutMs`.
 */
export function watchHostedScreen(timeoutMs = SCREEN_OPEN_TIMEOUT_MS): HostedScreenWatch {
  let resolveOpened!: (v: "shown" | "finished") => void;
  let rejectOpened!: (e: Error) => void;
  const opened = new Promise<"shown" | "finished">((resolve, reject) => {
    resolveOpened = resolve;
    rejectOpened = reject;
  });
  // Avoid an unhandled rejection if the caller stops watching early.
  opened.catch(() => undefined);

  let settled = false;
  let wasClosed = false;
  const onMessage = (event: MessageEvent) => {
    if (!CIRCLE_ORIGIN.test(event.origin) || !event.data || typeof event.data !== "object") return;
    const data = event.data as Record<string, unknown>;
    if (data.onClose) wasClosed = true;
    if (settled) return;
    if (data.showUi) {
      settled = true;
      resolveOpened("shown");
    } else if (data.onComplete || data.onError) {
      settled = true;
      resolveOpened("finished");
    }
  };
  window.addEventListener("message", onMessage);
  const timer = window.setTimeout(() => {
    if (!settled) {
      settled = true;
      rejectOpened(new HostedScreenTimeoutError());
    }
  }, timeoutMs);

  return {
    opened,
    closed: () => wasClosed,
    stop: () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    },
  };
}
