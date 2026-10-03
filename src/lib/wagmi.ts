import { defineChain } from 'viem';
import { createConfig, http } from 'wagmi';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { circleEmail } from './circle/emailConnector';

// Prefer a dedicated RPC endpoint (VITE_ARC_RPC_URL) when one is configured —
// the public Arc testnet RPC is shared and rate-limits heavy callers like the
// History page's eth_getLogs sweeps. Falls back to the public RPC so the app
// still works with zero env config.
const RPC_URL =
  (import.meta.env.VITE_ARC_RPC_URL as string | undefined) || 'https://rpc.testnet.arc.network';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  // Arc's native gas token is USDC with 18 decimals (eth_getBalance returns
  // 18-decimal units). The ERC-20 interface at USDC_ADDRESS uses 6 decimals;
  // app balances/amounts go through that contract and format with 6 explicitly.
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

// Same wallets RainbowKit's getDefaultConfig() would set up (Safe, Rainbow,
// Base, MetaMask, WalletConnect), built explicitly so the Circle email
// connector can be added alongside them. Passing `connectors` to
// getDefaultConfig() would REPLACE this list instead (its options are spread
// last), dropping MetaMask.
const { connectors: rainbowKitConnectors } = getDefaultWallets({
  appName: 'OinkAI',
  projectId: 'OINKAI_LOCAL_DEV',
});

export const config = createConfig({
  // circleEmail: read-only stage 1 — makes a persisted email session a wagmi
  // account. Not shown in RainbowKit's wallet list; it's connected
  // automatically by EmailWalletBridge when an email session exists.
  connectors: [...rainbowKitConnectors, circleEmail({ chain: arcTestnet })],
  chains: [arcTestnet],
  // getDefaultConfig()'s default: one http() transport per chain (default RPC).
  transports: { [arcTestnet.id]: http() },
  ssr: false,
});

export const OINKSAFE_ADDRESS = '0x8CA4e4037d853Fa63Ee96A100631d21F4daC29E6' as `0x${string}`;
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;
