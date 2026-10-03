// Persisted Circle email session (User-Controlled Wallets, email + OTP login).
//
// Stored as ONE versioned JSON record so a session is never half-written.
// Browser-only: every function no-ops on the server.
//
// Security notes (testnet tradeoff — see the session docs in useEmailSession):
// - localStorage is readable by any script on this origin, so an XSS bug could
//   read these tokens. A stolen userToken/refreshToken lets an attacker read
//   the wallet and CREATE challenges, but cannot move funds: every signature
//   needs the user's PIN, which is entered inside Circle's own cross-origin
//   iframe and never touches this app.
// - NEVER store the PIN or security-question answers here (or anywhere).
// - For mainnet, move refreshToken to an httpOnly cookie handled server-side.

const SESSION_KEY = "oink.circle.session.v1";
// Set when a refresh fails: the tokens are wiped but we remember that this
// browser had an email user, so the UI can ask them to log in again with OTP.
const NEEDS_LOGIN_KEY = "oink.circle.needsLogin.v1";

// Keys written by an earlier version of this file (never used in production,
// but cleared on logout so nothing lingers).
const LEGACY_KEYS = [
  "oink.circle.userId",
  "oink.circle.userToken",
  "oink.circle.userTokenExpiry",
  "oink.circle.encryptionKey",
  "oink.circle.walletAddress",
];

export interface EmailSession {
  v: 1;
  userToken: string;
  encryptionKey: string;
  refreshToken: string;
  /** From sdk.getDeviceId(); Circle's token refresh requires it. */
  deviceId: string;
  walletId: string;
  address: string;
  email?: string;
  /** Epoch ms when this userToken was issued. */
  issuedAt: number;
  /** Epoch ms when this userToken expires. */
  expiresAt: number;
}

export interface NeedsLoginMarker {
  address?: string;
  email?: string;
  reason: string;
  at: number;
}

const CHANGE_EVENT = "oink:email-session-change";

const isBrowser = () => typeof window !== "undefined";

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function notify() {
  if (isBrowser()) window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function readEmailSession(): EmailSession | null {
  const s = readJson<EmailSession>(SESSION_KEY);
  // Reject anything malformed rather than handing callers a partial session.
  if (
    !s ||
    s.v !== 1 ||
    !s.userToken ||
    !s.encryptionKey ||
    !s.refreshToken ||
    !s.deviceId ||
    !s.walletId ||
    !s.address ||
    typeof s.expiresAt !== "number"
  ) {
    return null;
  }
  return s;
}

export function writeEmailSession(session: EmailSession): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.localStorage.removeItem(NEEDS_LOGIN_KEY);
  } catch {
    // Storage full or disabled (private mode): the session just won't persist.
  }
  notify();
}

export function readNeedsLoginMarker(): NeedsLoginMarker | null {
  return readJson<NeedsLoginMarker>(NEEDS_LOGIN_KEY);
}

/** Wipes the tokens but remembers that this browser needs an OTP re-login. */
export function markEmailSessionNeedsLogin(marker: Omit<NeedsLoginMarker, "at">): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.setItem(NEEDS_LOGIN_KEY, JSON.stringify({ ...marker, at: Date.now() }));
  } catch {
    // ignore
  }
  notify();
}

/** Full logout: removes the session, the re-login marker and legacy keys. */
export function clearAllCircleStorage(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(NEEDS_LOGIN_KEY);
    for (const k of LEGACY_KEYS) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
  notify();
}

/**
 * Subscribe to session changes in this tab (CHANGE_EVENT) and in other tabs
 * (the browser's `storage` event). Returns an unsubscribe function.
 */
export function subscribeEmailSession(onChange: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === SESSION_KEY || e.key === NEEDS_LOGIN_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
