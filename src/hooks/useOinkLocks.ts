import { formatUnits } from 'viem';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { OINKSAFE_ADDRESS } from '@/lib/wagmi';
import { OINKSAFE_ABI } from '@/lib/abis';

const ARC_CHAIN_ID = 5042002;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// On-chain Lock shape — bigint for all numeric fields (viem's representation of uint256)
export type OinkLock = {
  id: bigint;
  owner: `0x${string}`;
  amount: bigint;         // USDC in 6-decimal base units
  lockedAt: bigint;       // unix timestamp (seconds)
  unlockAt: bigint;       // unix timestamp (seconds)
  durationDays: bigint;
  withdrawn: boolean;
  earlyWithdrawal: boolean;
};

// ── Formatting utilities ──────────────────────────────────────────────────────

export function formatUsdcAmount(rawAmount: bigint): string {
  return Number(formatUnits(rawAmount, 6)).toFixed(2);
}

export function formatUnixToDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// timestamp is unix seconds; returns days remaining, minimum 0, rounded up
export function daysRemaining(unlockAt: bigint): number {
  const nowSecs = Math.floor(Date.now() / 1000);
  return Math.max(0, Math.ceil((Number(unlockAt) - nowSecs) / 86_400));
}

// true when the lock's unlock time is now or in the past
export function isLockUnlocked(unlockAt: bigint): boolean {
  return unlockAt <= BigInt(Math.floor(Date.now() / 1000));
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface OinkLocksResult {
  locks: OinkLock[] | null;
  completedLocks: OinkLock[] | null; // withdrawn locks, sorted newest first
  totalLocked: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isError: boolean;
  wrongNetwork: boolean;
  refetch: () => void;
}

export function useOinkLocks(): OinkLocksResult {
  const { address, chainId } = useAccount();
  const isConnected = !!address;
  const wrongNetwork = isConnected && chainId !== ARC_CHAIN_ID;

  const enabled = isConnected && !wrongNetwork;

  // Active (non-withdrawn) locks — fast, used by dashboard and savings
  const {
    data: activeLocks,
    isPending: locksPending,
    isError: locksError,
    refetch: refetchLocks,
  } = useReadContract({
    address: OINKSAFE_ADDRESS,
    abi: OINKSAFE_ABI,
    functionName: 'getActiveLocks',
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled,
      refetchInterval: 12_000,
    },
  });

  const {
    data: rawTotalLocked,
    isPending: totalPending,
    isError: totalError,
    refetch: refetchTotal,
  } = useReadContract({
    address: OINKSAFE_ADDRESS,
    abi: OINKSAFE_ABI,
    functionName: 'getTotalLocked',
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled,
      refetchInterval: 12_000,
    },
  });

  // All lock IDs (including withdrawn) — used to fetch completed lock history
  const {
    data: userLockIds,
    refetch: refetchIds,
  } = useReadContract({
    address: OINKSAFE_ADDRESS,
    abi: OINKSAFE_ABI,
    functionName: 'getUserLockIds',
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled,
      refetchInterval: 30_000,
    },
  });

  const lockIdsArr = userLockIds ? (userLockIds as unknown as bigint[]) : [];

  // Batch-fetch individual lock data for each ID (to get withdrawn locks)
  const {
    data: allLocksRaw,
    refetch: refetchAllLocks,
  } = useReadContracts({
    contracts: lockIdsArr.map((id) => ({
      address: OINKSAFE_ADDRESS,
      abi: OINKSAFE_ABI,
      functionName: 'getLock' as const,
      args: [id] as const,
    })),
    query: {
      enabled: enabled && lockIdsArr.length > 0,
      refetchInterval: 30_000,
    },
  });

  const totalLocked = rawTotalLocked !== undefined
    ? formatUsdcAmount(rawTotalLocked)
    : null;

  // Derive completed (withdrawn) locks from the batch result
  const completedLocks: OinkLock[] | null = (() => {
    if (!enabled || userLockIds === undefined) return null;
    if (lockIdsArr.length === 0) return [];
    if (!allLocksRaw) return null;
    return allLocksRaw
      .filter((r) => r.status === 'success' && r.result !== undefined)
      .map((r) => r.result as unknown as OinkLock)
      .filter((l) => l.withdrawn)
      .sort((a, b) => Number(b.lockedAt) - Number(a.lockedAt));
  })();

  return {
    locks: activeLocks ? (activeLocks as unknown as OinkLock[]) : null,
    completedLocks,
    totalLocked,
    isConnected,
    // isPending is true even on disabled queries; guard so it doesn't show
    // a false loading state when the wallet isn't connected
    isLoading: (locksPending || totalPending) && enabled,
    isError: locksError || totalError,
    wrongNetwork,
    refetch: () => {
      void refetchLocks();
      void refetchTotal();
      void refetchIds();
      void refetchAllLocks();
    },
  };
}
