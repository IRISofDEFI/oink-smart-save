import { useEffect } from "react";
import { useEmailSession } from "@/hooks/useEmailSession";
import { readEmailSession, refreshEmailSession, clearEmailSession } from "@/lib/circle";

const LOG_TAG = "[EmailSession]";

const redact = (token: string | null) => (token ? `${token.slice(0, 8)}…${token.slice(-4)}` : null);

/**
 * Mounted once in the root layout. Renders nothing; keeps the persisted email
 * session's token fresh on every page (via useEmailSession's refresh timer).
 *
 * Dev builds only: logs status changes (tokens redacted) and exposes
 * window.__oinkEmailSession = { read(), refresh(), clear() } for debugging.
 */
export function EmailSessionKeeper() {
  const { ready, status, address, walletId, userToken, expiresAt } = useEmailSession();

  useEffect(() => {
    if (!import.meta.env.DEV || !ready) return;
    console.log(LOG_TAG, {
      status,
      address,
      walletId,
      userToken: redact(userToken),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      minutesLeft: expiresAt ? Math.round((expiresAt - Date.now()) / 60000) : null,
    });
  }, [ready, status, address, walletId, userToken, expiresAt]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__oinkEmailSession = {
      read: () => {
        const s = readEmailSession();
        return s ? { ...s, userToken: redact(s.userToken), refreshToken: redact(s.refreshToken), encryptionKey: "[redacted]" } : null;
      },
      refresh: async () => {
        const before = readEmailSession()?.userToken ?? null;
        const outcome = await refreshEmailSession();
        const after = readEmailSession()?.userToken ?? null;
        return { outcome, before: redact(before), after: redact(after), changed: !!after && after !== before };
      },
      clear: () => clearEmailSession(),
    };
  }, []);

  return null;
}
