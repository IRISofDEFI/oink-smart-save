import { useEffect, useRef } from "react";
import { useAccount, useConnect, useConnections, useConnectors, useDisconnect } from "wagmi";
import { useEmailSession } from "@/hooks/useEmailSession";
import { CIRCLE_EMAIL_CONNECTOR_ID, markSilentEmailDisconnect } from "@/lib/circle/emailConnector";

const LOG_TAG = "[EmailWallet]";

/**
 * Keeps wagmi's account in step with the persisted Circle email session.
 * Mounted once in the root layout; renders nothing.
 *
 * Precedence — one identity at a time, an external wallet wins:
 *  1. Any other wallet (MetaMask, WalletConnect, …) connected -> the email
 *     connector is dropped (silently: the stored email session is kept, so it
 *     comes back if that wallet disconnects).
 *  2. Email session exists and NO wallet is connected -> connect the email
 *     connector (e.g. right after email sign-up).
 *  3. Email session gone (logout / needs re-login) -> disconnect the email
 *     connector (silently; the session is already cleared, and a needs-login
 *     marker must survive).
 *  A user-initiated wagmi disconnect of the email connector (e.g. RainbowKit's
 *  "Disconnect") is treated as a logout by the connector itself.
 */
export function EmailWalletBridge() {
  const { ready, status } = useEmailSession();
  const { status: wagmiStatus } = useAccount();
  const connections = useConnections();
  const connectors = useConnectors();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const busy = useRef(false);

  const emailConnector = connectors.find((c) => c.id === CIRCLE_EMAIL_CONNECTOR_ID);
  const hasSession = status === "active" || status === "expired-refreshable";
  const emailConnected = connections.some((c) => c.connector.id === CIRCLE_EMAIL_CONNECTOR_ID);
  const otherConnected = connections.some((c) => c.connector.id !== CIRCLE_EMAIL_CONNECTOR_ID);

  useEffect(() => {
    if (!ready || !emailConnector || busy.current) return;
    // Let wagmi finish restoring previous connections first.
    if (wagmiStatus === "reconnecting" || wagmiStatus === "connecting") return;

    let action: (() => Promise<unknown>) | null = null;
    let reason = "";
    if (emailConnected && (!hasSession || otherConnected)) {
      reason = !hasSession ? "email session ended" : "another wallet is connected (it takes precedence)";
      action = () => {
        markSilentEmailDisconnect();
        return disconnectAsync({ connector: emailConnector });
      };
    } else if (hasSession && !emailConnected && !otherConnected) {
      reason = "email session active, no wallet connected";
      action = () => connectAsync({ connector: emailConnector });
    }
    if (!action) return;

    busy.current = true;
    if (import.meta.env.DEV) console.log(LOG_TAG, reason);
    action()
      .catch((err) => console.warn(LOG_TAG, "sync failed:", err))
      .finally(() => {
        busy.current = false;
      });
  }, [ready, emailConnector, wagmiStatus, hasSession, emailConnected, otherConnected, connectAsync, disconnectAsync]);

  return null;
}
