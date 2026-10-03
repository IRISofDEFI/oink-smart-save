// Client-side lifecycle for the persisted Circle email session: save at login,
// refresh before expiry (or after Circle rejects the token), and clear on
// logout. React code should read it through useEmailSession(); this module is
// the non-React layer that hook (and later the wagmi connector) builds on.
import { refreshCircleUserToken } from "./tokens";
import {
  clearAllCircleStorage,
  markEmailSessionNeedsLogin,
  readEmailSession,
  writeEmailSession,
  type EmailSession,
} from "./storage";

/** Circle documents userTokens as valid for 60 minutes. */
const DEFAULT_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
/** Refresh this long before expiry, so in-flight calls never carry a dead token. */
export const REFRESH_MARGIN_MS = 5 * 60 * 1000;

const LOG_TAG = "[EmailSession]";

/**
 * Reads `exp` from the userToken if it's a JWT (Circle documents it as one);
 * falls back to the documented 60-minute lifetime from issue time.
 */
function tokenExpiry(userToken: string, issuedAt: number): number {
  try {
    const payload = userToken.split(".")[1];
    if (payload) {
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      if (typeof json.exp === "number") return json.exp * 1000;
    }
  } catch {
    // not a JWT we can read — use the documented lifetime
  }
  return issuedAt + DEFAULT_TOKEN_LIFETIME_MS;
}

export interface NewEmailSessionInput {
  userToken: string;
  encryptionKey: string;
  refreshToken: string;
  deviceId: string;
  walletId: string;
  address: string;
  email?: string;
}

/** Called once login + wallet lookup succeed on /signup. */
export function saveEmailSession(input: NewEmailSessionInput): EmailSession {
  const issuedAt = Date.now();
  const session: EmailSession = {
    v: 1,
    ...input,
    issuedAt,
    expiresAt: tokenExpiry(input.userToken, issuedAt),
  };
  writeEmailSession(session);
  return session;
}

/** Logout: wipes everything; useEmailSession() goes back to "none". */
export function clearEmailSession(): void {
  clearAllCircleStorage();
}

export function isNearExpiry(session: EmailSession, now = Date.now()): boolean {
  return session.expiresAt - now <= REFRESH_MARGIN_MS;
}

export type RefreshOutcome = "refreshed" | "needs-login" | "retry-later" | "no-session";

// Single-flight: Circle rotates the refreshToken on every refresh, so two
// concurrent refreshes would race and the loser would present a spent token.
let inFlight: Promise<RefreshOutcome> | null = null;

/**
 * Exchanges the stored refreshToken for a new userToken and persists it.
 * - Circle rejects the refresh (4xx): the session is cleared and marked
 *   "needs login", so the user has to sign in again with OTP.
 * - Network / 5xx: the session is kept and "retry-later" is returned.
 */
export function refreshEmailSession(): Promise<RefreshOutcome> {
  if (inFlight) return inFlight;
  inFlight = (async (): Promise<RefreshOutcome> => {
    const session = readEmailSession();
    if (!session) return "no-session";

    let result;
    try {
      result = await refreshCircleUserToken({
        data: {
          userToken: session.userToken,
          refreshToken: session.refreshToken,
          deviceId: session.deviceId,
        },
      });
    } catch (err) {
      console.warn(LOG_TAG, "refresh request failed (will retry):", err);
      return "retry-later";
    }

    if (result.ok) {
      const issuedAt = Date.now();
      writeEmailSession({
        ...session,
        userToken: result.userToken,
        encryptionKey: result.encryptionKey,
        refreshToken: result.refreshToken,
        issuedAt,
        expiresAt: tokenExpiry(result.userToken, issuedAt),
      });
      if (import.meta.env.DEV) console.log(LOG_TAG, "token refreshed");
      return "refreshed";
    }

    if (result.status >= 400 && result.status < 500) {
      console.warn(LOG_TAG, `refresh rejected by Circle (${result.status}/${result.code}): ${result.message}`);
      markEmailSessionNeedsLogin({
        address: session.address,
        email: session.email,
        reason: `refresh rejected (${result.code})`,
      });
      return "needs-login";
    }

    console.warn(LOG_TAG, `refresh failed (${result.status}/${result.code}), will retry: ${result.message}`);
    return "retry-later";
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/**
 * Returns a userToken that is good for at least REFRESH_MARGIN_MS, refreshing
 * first if needed. Null when there's no usable session.
 */
export async function getValidUserToken(): Promise<string | null> {
  const session = readEmailSession();
  if (!session) return null;
  if (!isNearExpiry(session)) return session.userToken;
  const outcome = await refreshEmailSession();
  if (outcome === "refreshed") return readEmailSession()?.userToken ?? null;
  // retry-later: hand back the current token only if it hasn't actually expired.
  if (outcome === "retry-later" && session.expiresAt > Date.now()) return session.userToken;
  return null;
}

/** Circle's "token not found / expired / invalid" family, or an HTTP 401/403. */
export function isCircleAuthError(err: unknown): boolean {
  const code = (err as { code?: number })?.code;
  const status = (err as { status?: number })?.status;
  if (code === 155103 || code === 155104 || code === 155105) return true;
  if (status === 401 || status === 403) return true;
  // Errors thrown by server functions arrive without their code; match the text.
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /usertoken/i.test(message) && /(expired|invalid|not found)/i.test(message);
}

/**
 * Runs a Circle call with a fresh userToken. If Circle rejects the token
 * anyway (the 401-equivalent), refreshes once and retries.
 */
export async function withEmailSession<T>(call: (userToken: string) => Promise<T>): Promise<T> {
  const token = await getValidUserToken();
  if (!token) throw new Error("No active email session — please log in again.");
  try {
    return await call(token);
  } catch (err) {
    if (!isCircleAuthError(err)) throw err;
    const outcome = await refreshEmailSession();
    const fresh = outcome === "refreshed" ? readEmailSession()?.userToken : null;
    if (!fresh) throw err;
    return call(fresh);
  }
}
