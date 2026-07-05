import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { OINKSAFE_ADDRESS } from '@/lib/wagmi';
import { OINKSAFE_ABI } from '@/lib/abis';

const ARC_CHAIN_ID = 5042002;

// Arc's public RPC caps eth_getLogs at 10,000 blocks per request.
// Use 9,000 to stay safely under the limit.
const DEPLOY_BLOCK = 49439242n;
const CHUNK_SIZE = 9000n;

export interface OinkEvent {
  type: 'LockCreated' | 'LockWithdrawn';
  lockId: bigint;
  amount: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  // LockCreated fields
  durationDays?: bigint;
  unlockAt?: bigint;
  // LockWithdrawn fields
  earlyWithdrawal?: boolean;
}

export interface OinkHistoryResult {
  events: OinkEvent[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  loadingProgress: number; // 0–1
  isConnected: boolean;
  wrongNetwork: boolean;
  refetch: () => void;
}

export function useOinkHistory(): OinkHistoryResult {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();

  const isConnected = !!address;
  const wrongNetwork = isConnected && chainId !== ARC_CHAIN_ID;
  const enabled = isConnected && !wrongNetwork;

  const [events, setEvents] = useState<OinkEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fetchEvents = useCallback(async () => {
    if (!enabled || !address || !publicClient) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);
    setLoadingProgress(0);

    try {
      const currentBlock = await publicClient.getBlockNumber();

      const blockRange = currentBlock >= DEPLOY_BLOCK ? currentBlock - DEPLOY_BLOCK : 0n;
      const totalChunks = Math.ceil(Number(blockRange + 1n) / Number(CHUNK_SIZE));

      const allCreated: OinkEvent[] = [];
      const allWithdrawn: OinkEvent[] = [];
      let chunksDone = 0;

      for (let chunkFrom = DEPLOY_BLOCK; chunkFrom <= currentBlock; chunkFrom += CHUNK_SIZE) {
        const chunkTo =
          chunkFrom + CHUNK_SIZE - 1n < currentBlock
            ? chunkFrom + CHUNK_SIZE - 1n
            : currentBlock;

        // Fire LockCreated and LockWithdrawn in parallel for each chunk.
        // Chunks themselves are sequential to avoid flooding the RPC.
        const [createdLogs, withdrawnLogs] = await Promise.all([
          publicClient.getContractEvents({
            address: OINKSAFE_ADDRESS,
            abi: OINKSAFE_ABI,
            eventName: 'LockCreated',
            args: { owner: address },
            fromBlock: chunkFrom,
            toBlock: chunkTo,
          }),
          publicClient.getContractEvents({
            address: OINKSAFE_ADDRESS,
            abi: OINKSAFE_ABI,
            eventName: 'LockWithdrawn',
            args: { owner: address },
            fromBlock: chunkFrom,
            toBlock: chunkTo,
          }),
        ]);

        for (const log of createdLogs) {
          allCreated.push({
            type: 'LockCreated',
            lockId: log.args.lockId!,
            amount: log.args.amount!,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: (log.transactionHash ?? '0x0') as `0x${string}`,
            durationDays: log.args.durationDays!,
            unlockAt: log.args.unlockAt!,
          });
        }

        for (const log of withdrawnLogs) {
          allWithdrawn.push({
            type: 'LockWithdrawn',
            lockId: log.args.lockId!,
            amount: log.args.amount!,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: (log.transactionHash ?? '0x0') as `0x${string}`,
            earlyWithdrawal: log.args.earlyWithdrawal!,
          });
        }

        chunksDone++;
        setLoadingProgress(chunksDone / totalChunks);
      }

      const all = [...allCreated, ...allWithdrawn].sort(
        (a, b) => Number(b.blockNumber) - Number(a.blockNumber),
      );

      setEvents(all);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error('[useOinkHistory] fetch failed:', e.message, err);
      setIsError(true);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, address, publicClient]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    isError,
    error,
    loadingProgress,
    isConnected,
    wrongNetwork,
    refetch: () => { void fetchEvents(); },
  };
}
