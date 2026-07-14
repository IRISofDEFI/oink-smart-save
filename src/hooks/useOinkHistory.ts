import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { OINKSAFE_ADDRESS } from '@/lib/wagmi';
import { OINKSAFE_ABI } from '@/lib/abis';

const ARC_CHAIN_ID = 5042002;

// Arc's public RPC caps eth_getLogs at 10,000 blocks per request.
// Use 9,000 to stay safely under the limit.
const DEPLOY_BLOCK = 49439242n;
const CHUNK_SIZE = 9000n;
// How many 9k-block chunks to fetch concurrently per batch.
const BATCH_CONCURRENCY = 4;

// Module-level, in-memory only — cleared on full page reload, keyed by wallet address.
const eventsCache = new Map<string, OinkEvent[]>();

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

  const fetchEvents = useCallback(async (opts?: { force?: boolean }) => {
    if (!enabled || !address || !publicClient) return;

    const cacheKey = address.toLowerCase();
    if (!opts?.force) {
      const cached = eventsCache.get(cacheKey);
      if (cached) {
        setEvents(cached);
        setIsLoading(false);
        setIsError(false);
        setError(null);
        setLoadingProgress(1);
        return;
      }
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);
    setLoadingProgress(0);

    try {
      const currentBlock = await publicClient.getBlockNumber();

      const chunkRanges: Array<{ from: bigint; to: bigint }> = [];
      for (let chunkFrom = DEPLOY_BLOCK; chunkFrom <= currentBlock; chunkFrom += CHUNK_SIZE) {
        const chunkTo =
          chunkFrom + CHUNK_SIZE - 1n < currentBlock
            ? chunkFrom + CHUNK_SIZE - 1n
            : currentBlock;
        chunkRanges.push({ from: chunkFrom, to: chunkTo });
      }

      const totalChunks = chunkRanges.length;
      const allCreated: OinkEvent[] = [];
      const allWithdrawn: OinkEvent[] = [];
      let chunksDone = 0;

      // Fetch chunks in small parallel batches to speed things up without
      // flooding the RPC with all requests at once.
      for (let i = 0; i < chunkRanges.length; i += BATCH_CONCURRENCY) {
        const batch = chunkRanges.slice(i, i + BATCH_CONCURRENCY);

        const batchResults = await Promise.all(
          batch.map(({ from, to }) =>
            Promise.all([
              publicClient.getContractEvents({
                address: OINKSAFE_ADDRESS,
                abi: OINKSAFE_ABI,
                eventName: 'LockCreated',
                args: { owner: address },
                fromBlock: from,
                toBlock: to,
              }),
              publicClient.getContractEvents({
                address: OINKSAFE_ADDRESS,
                abi: OINKSAFE_ABI,
                eventName: 'LockWithdrawn',
                args: { owner: address },
                fromBlock: from,
                toBlock: to,
              }),
            ]),
          ),
        );

        for (const [createdLogs, withdrawnLogs] of batchResults) {
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
      }

      const all = [...allCreated, ...allWithdrawn].sort(
        (a, b) => Number(b.blockNumber) - Number(a.blockNumber),
      );

      eventsCache.set(cacheKey, all);
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
    refetch: () => { void fetchEvents({ force: true }); },
  };
}
