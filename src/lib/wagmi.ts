import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Prefer a dedicated RPC endpoint (VITE_ARC_RPC_URL) when one is configured —
// the public Arc testnet RPC is shared and rate-limits heavy callers like the
// History page's eth_getLogs sweeps. Falls back to the public RPC so the app
// still works with zero env config.
const RPC_URL =
  (import.meta.env.VITE_ARC_RPC_URL as string | undefined) || 'https://rpc.testnet.arc.network';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'OinkAI',
  projectId: 'OINKAI_LOCAL_DEV',
  chains: [arcTestnet],
  ssr: false,
});

export const OINKSAFE_ADDRESS = '0x8CA4e4037d853Fa63Ee96A100631d21F4daC29E6' as `0x${string}`;
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;
