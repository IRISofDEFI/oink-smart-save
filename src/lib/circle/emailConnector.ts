// "Circle Email" wagmi connector — STAGE 1 (read-only).
//
// Makes a persisted Circle email session (see storage.ts / session.ts) look
// like a connected wallet to wagmi, so useAccount() and every read hook work
// for email users exactly as for MetaMask users.
//
// Stage 1 scope:
//   - accounts / chain come from the email session; Arc Testnet only
//   - read RPC methods are forwarded to the Arc RPC
//   - signing / sending throws EmailSigningNotImplementedError (stage 2 will
//     route these through Circle challenges + the PIN screen)
//
// Not exported from the ./index barrel on purpose: that barrel is reachable
// from server code, and nothing server-side needs wagmi connectors.
import { createConnector } from "wagmi";
import { getAddress, numberToHex, type Address, type Chain } from "viem";
import { clearEmailSession } from "./session";
import { readEmailSession, subscribeEmailSession } from "./storage";

export const CIRCLE_EMAIL_CONNECTOR_ID = "circleEmail";

// Methods that need the user's key. Everything else is a read and is forwarded.
const SIGNING_METHODS = new Set([
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_sign",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v3",
  "eth_signTypedData_v4",
  "wallet_sendCalls",
  "wallet_grantPermissions",
]);

/** EIP-1193 "unsupported method" (4200). */
export class EmailSigningNotImplementedError extends Error {
  code = 4200;
  constructor(method: string) {
    super(
      `Email wallet signing isn't implemented yet (stage 2) — "${method}" is not available for Circle email wallets.`,
    );
    this.name = "EmailSigningNotImplementedError";
  }
}

class ProviderRpcError extends Error {
  code: number;
  data?: unknown;
  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

type RequestArgs = { method: string; params?: unknown[] | Record<string, unknown> };
type Listener = (...args: unknown[]) => void;

function currentAccounts(): Address[] {
  const s = readEmailSession();
  return s ? [getAddress(s.address)] : [];
}

/** Minimal EIP-1193 provider backed by the email session + the Arc RPC. */
export function createEmailProvider(chain: Chain) {
  const rpcUrl = chain.rpcUrls.default.http[0];
  const listeners = new Map<string, Set<Listener>>();
  let nextId = 0;

  async function forward(method: string, params: RequestArgs["params"]) {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++nextId, method, params: params ?? [] }),
    });
    const json = (await res.json()) as { result?: unknown; error?: { code: number; message: string; data?: unknown } };
    if (json.error) throw new ProviderRpcError(json.error.code, json.error.message, json.error.data);
    return json.result;
  }

  return {
    async request({ method, params }: RequestArgs): Promise<unknown> {
      switch (method) {
        case "eth_accounts":
        case "eth_requestAccounts":
          return currentAccounts();
        case "eth_chainId":
          return numberToHex(chain.id);
        case "net_version":
          return String(chain.id);
        case "wallet_switchEthereumChain": {
          const target = Number((params as { chainId?: string }[] | undefined)?.[0]?.chainId);
          if (target === chain.id) return null;
          throw new ProviderRpcError(4902, `Circle email wallets only support ${chain.name}.`);
        }
      }
      if (SIGNING_METHODS.has(method)) throw new EmailSigningNotImplementedError(method);
      return forward(method, params);
    },
    on(event: string, fn: Listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    },
    removeListener(event: string, fn: Listener) {
      listeners.get(event)?.delete(fn);
    },
    emit(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((fn) => fn(...args));
    },
  };
}

type EmailProvider = ReturnType<typeof createEmailProvider>;

// When the bridge drops this connector only because another wallet took
// precedence (or because the session is already gone), the stored email
// session must NOT be wiped. A user-initiated disconnect (wagmi
// useDisconnect, RainbowKit's "Disconnect") is a logout and does wipe it.
let silentNextDisconnect = false;
export function markSilentEmailDisconnect(): void {
  silentNextDisconnect = true;
}

export function circleEmail({ chain }: { chain: Chain }) {
  let provider: EmailProvider | undefined;
  let unsubscribe: (() => void) | undefined;

  return createConnector<EmailProvider>((config) => ({
    id: CIRCLE_EMAIL_CONNECTOR_ID,
    name: "Circle Email",
    type: "circleEmail",

    async connect({ withCapabilities } = {}) {
      const session = readEmailSession();
      if (!session) {
        throw new Error("No Circle email session — sign up or log in with email first.");
      }
      // Follow the session: logout -> disconnect, address change -> change.
      unsubscribe?.();
      let lastAddress = getAddress(session.address);
      unsubscribe = subscribeEmailSession(() => {
        const next = readEmailSession();
        if (!next) {
          this.onDisconnect();
          return;
        }
        const address = getAddress(next.address);
        if (address !== lastAddress) {
          lastAddress = address;
          this.onAccountsChanged([address]);
        }
      });

      const address = getAddress(session.address);
      return {
        accounts: (withCapabilities ? [{ address, capabilities: {} }] : [address]) as never,
        chainId: chain.id,
      };
    },

    async disconnect() {
      unsubscribe?.();
      unsubscribe = undefined;
      if (silentNextDisconnect) {
        silentNextDisconnect = false;
        return;
      }
      clearEmailSession();
    },

    async getAccounts() {
      return currentAccounts();
    },

    async getChainId() {
      return chain.id;
    },

    async getProvider() {
      provider ??= createEmailProvider(chain);
      return provider;
    },

    // True whenever a session is stored, so wagmi restores email users on
    // reload without a "connect wallet" flash. Which identity wins when
    // MetaMask is also authorised is decided in EmailWalletBridge.
    async isAuthorized() {
      return readEmailSession() !== null;
    },

    async switchChain({ chainId }) {
      if (chainId !== chain.id) {
        throw new ProviderRpcError(4902, `Circle email wallets only support ${chain.name}.`);
      }
      return chain;
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else config.emitter.emit("change", { accounts: accounts.map((a) => getAddress(a)) });
    },

    onChainChanged(chainId) {
      config.emitter.emit("change", { chainId: Number(chainId) });
    },

    async onDisconnect() {
      unsubscribe?.();
      unsubscribe = undefined;
      config.emitter.emit("disconnect");
    },
  }));
}
