import { formatUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { USDC_ADDRESS } from '@/lib/wagmi';
import { USDC_ABI } from '@/lib/abis';

const ARC_CHAIN_ID = 5042002;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export interface UsdcBalanceResult {
  balance: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  wrongNetwork: boolean;
  refetch: () => void;
}

export function useUsdcBalance(): UsdcBalanceResult {
  const { address, chainId } = useAccount();
  const isConnected = !!address;
  const wrongNetwork = isConnected && chainId !== ARC_CHAIN_ID;

  const { data, isPending, isFetching, isError, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address ?? ZERO_ADDRESS],
    query: {
      // Don't run when disconnected or on wrong network
      enabled: isConnected && !wrongNetwork,
      // Poll roughly every block (~12s) so the balance feels live
      refetchInterval: 12_000,
    },
  });

  const balance = data !== undefined
    ? Number(formatUnits(data, 6)).toFixed(2)
    : null;

  return {
    balance,
    isConnected,
    // isPending = true only when there's no cached data yet (initial load)
    // We gate with isConnected & !wrongNetwork so a disabled query's isPending
    // doesn't leak through as a false "loading" state
    isLoading: isPending && isConnected && !wrongNetwork,
    // isFetching = true on any active fetch, including background refetches —
    // used to spin the refresh button without blanking the displayed value
    isFetching,
    isError,
    wrongNetwork,
    refetch: () => { void refetch(); },
  };
}
