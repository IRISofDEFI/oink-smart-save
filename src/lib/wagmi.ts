import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
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
