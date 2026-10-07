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
//
// It also keeps Circle's screen usable on top of our own modals. The SDK
// appends its iframe straight to <body>, outside any dialog. While a modal
// Radix dialog is open (e.g. the lock modal), Radix sets
// `body.style.pointerEvents = "none"` — which the iframe inherits, so every
// click on Circle's Confirm button silently goes nowhere — and its focus trap
// pulls focus back out of anything outside the dialog (which would break
// typing a PIN). See makeHostedScreenInteractive().
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

const SDK_IFRAME_ID = "sdkIframe";

/**
 * Makes Circle's iframe receive clicks and keep focus even while one of our
 * modal dialogs is open underneath it. Returns a function that removes the
 * focus guard (the pointer-events override stays on the SDK's reused iframe
 * element, where it's harmless).
 */
export function makeHostedScreenInteractive(): () => void {
  const iframe = document.getElementById(SDK_IFRAME_ID);
  if (!iframe) return () => undefined;
  // Override the `pointer-events: none` inherited from <body>.
  iframe.style.pointerEvents = "auto";
  // Radix's focus trap listens for focusin/focusout on `document` (bubble
  // phase). Stop only the events that move focus INTO Circle's iframe before
  // they reach it, so the trap doesn't yank focus back to the dialog.
  const guard = (event: FocusEvent) => {
    if (event.target === iframe || event.relatedTarget === iframe) event.stopPropagation();
  };
  window.addEventListener("focusin", guard, true);
  window.addEventListener("focusout", guard, true);
  return () => {
    window.removeEventListener("focusin", guard, true);
    window.removeEventListener("focusout", guard, true);
  };
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
export function watchHostedScreen(
  timeoutMs = SCREEN_OPEN_TIMEOUT_MS,
  /** Diagnostics: called with the message's key names only (never values). */
  onMessageKeys?: (keys: string[]) => void,
): HostedScreenWatch {
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
  let releaseScreen: (() => void) | null = null;
  let stopped = false;
  const onMessage = (event: MessageEvent) => {
    if (!CIRCLE_ORIGIN.test(event.origin) || !event.data || typeof event.data !== "object") return;
    const data = event.data as Record<string, unknown>;
    onMessageKeys?.(Object.keys(data));
    if (data.onClose) wasClosed = true;
    // Circle revealed its screen: make sure our page isn't swallowing input.
    // (The SDK applies its own styles in the same message, so do it after.)
    if (data.showUi && !releaseScreen) {
      window.setTimeout(() => {
        if (!stopped) releaseScreen ??= makeHostedScreenInteractive();
      }, 0);
    }
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
      stopped = true;
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
      releaseScreen?.();
      releaseScreen = null;
    },
  };
}
