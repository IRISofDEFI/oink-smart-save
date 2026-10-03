import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  clearEmailSession,
  isNearExpiry,
  readEmailSession,
  readNeedsLoginMarker,
  refreshEmailSession,
  REFRESH_MARGIN_MS,
  subscribeEmailSession,
  type EmailSession,
  type NeedsLoginMarker,
  type RefreshOutcome,
} from "@/lib/circle";

/**
 * - none:                 no email user in this browser
 * - active:               token valid beyond the refresh margin
 * - expired-refreshable:  token expired or about to; a refresh is (or will be) attempted
 * - expired-needs-login:  Circle rejected the refresh; the user must log in again with OTP
 */
export type EmailSessionStatus = "none" | "active" | "expired-refreshable" | "expired-needs-login";

export interface EmailSessionState {
  /**
   * False on the server and the first client render (both report "none" so
   * hydration matches); true once the real stored session has been read.
   * Don't redirect or show "logged out" UI until this is true.
   */
  ready: boolean;
  status: EmailSessionStatus;
  address: `0x${string}` | null;
  walletId: string | null;
  userToken: string | null;
  /** Needed with userToken for Circle SDK challenges (sdk.setAuthentication). */
  encryptionKey: string | null;
  email: string | null;
  expiresAt: number | null;
  /** Present when status is expired-needs-login. */
  needsLogin: NeedsLoginMarker | null;
  refresh: () => Promise<RefreshOutcome>;
  clear: () => void;
}

// --- external store -------------------------------------------------------
// useSyncExternalStore needs a stable snapshot between changes, so the parsed
// localStorage values are cached and only re-read when the store notifies.
type Snapshot = { session: EmailSession | null; needsLogin: NeedsLoginMarker | null };
const SERVER_SNAPSHOT: Snapshot = { session: null, needsLogin: null };
let cached: Snapshot | null = null;

function getSnapshot(): Snapshot {
  if (!cached) cached = { session: readEmailSession(), needsLogin: readNeedsLoginMarker() };
  return cached;
}

function subscribe(onChange: () => void) {
  return subscribeEmailSession(() => {
    cached = null;
    onChange();
  });
}

// SSR (and the first client render, so hydration matches): no session.
const getServerSnapshot = () => SERVER_SNAPSHOT;

/** Backoff between refresh attempts after a transient (network / 5xx) failure. */
const RETRY_AFTER_MS = 30_000;

// --- hook -------------------------------------------------------------------

/**
 * Single source of truth for "is there an email (Circle) user, and who are
 * they". Read-only session state plus refresh/clear. Every mounted instance
 * keeps the token fresh: a timer refreshes REFRESH_MARGIN_MS before expiry,
 * and returning to the tab (where timers are throttled) re-checks.
 *
 * Not wired into wagmi's useAccount or the contract hooks — that's the
 * connector's job, later.
 */
export function useEmailSession(): EmailSessionState {
  const { session, needsLogin } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Re-render when the token crosses the refresh margin, so status flips from
  // active to expired-refreshable even if nothing else changes.
  const [, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!session) return;
    let timer: number | undefined;
    let cancelled = false;

    // Refresh if near expiry. A successful refresh writes a new session, which
    // re-runs this effect with a new schedule; a transient failure
    // ("retry-later") retries on a fixed backoff while the page stays open.
    const check = async () => {
      const current = readEmailSession();
      if (!current || !isNearExpiry(current)) return;
      const outcome = await refreshEmailSession();
      if (outcome === "retry-later" && !cancelled) {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => void check(), RETRY_AFTER_MS);
      }
    };

    const delay = session.expiresAt - REFRESH_MARGIN_MS - Date.now();
    if (delay <= 0) {
      void check();
    } else {
      timer = window.setTimeout(() => {
        setTick((t) => t + 1); // flip status to expired-refreshable
        void check();
      }, delay + 1000);
    }

    // Background tabs throttle timers; re-check when the user comes back.
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session]);

  const refresh = useCallback(() => refreshEmailSession(), []);
  const clear = useCallback(() => clearEmailSession(), []);

  let status: EmailSessionStatus = "none";
  if (session) status = isNearExpiry(session) ? "expired-refreshable" : "active";
  else if (needsLogin) status = "expired-needs-login";

  return {
    ready,
    status,
    address: (session?.address as `0x${string}` | undefined) ?? null,
    walletId: session?.walletId ?? null,
    userToken: session?.userToken ?? null,
    encryptionKey: session?.encryptionKey ?? null,
    email: session?.email ?? null,
    expiresAt: session?.expiresAt ?? null,
    needsLogin: session ? null : needsLogin,
    refresh,
    clear,
  };
}
