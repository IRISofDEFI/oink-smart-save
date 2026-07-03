import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { OINKSAFE_ADDRESS } from '@/lib/wagmi';
import { OINKSAFE_ABI } from '@/lib/abis';

export type WithdrawState =
  | 'idle'
  | 'withdrawing'
  | 'withdraw-pending'
  | 'success'
  | 'error';

export interface UseWithdrawLockResult {
  state: WithdrawState;
  currentTxHash: `0x${string}` | null;
  errorMessage: string | null;
  executeWithdraw: (lockId: bigint) => Promise<void>;
  reset: () => void;
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: number })?.code;
  const msg = String(err).toLowerCase();
  if (
    code === 4001 ||
    msg.includes('user rejected') ||
    msg.includes('user denied') ||
    msg.includes('rejected the request')
  ) {
    return 'Transaction cancelled';
  }
  return 'Something went wrong. Please try again.';
}

export function useWithdrawLock(): UseWithdrawLockResult {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [state, setState] = useState<WithdrawState>('idle');
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setCurrentTxHash(null);
    setErrorMessage(null);
  }, []);

  const executeWithdraw = useCallback(
    async (lockId: bigint) => {
      if (!address) {
        setErrorMessage('No wallet connected');
        setState('error');
        return;
      }
      if (!publicClient) {
        setErrorMessage('Network client not available');
        setState('error');
        return;
      }

      try {
        setState('withdrawing');
        setCurrentTxHash(null);

        const hash = await writeContractAsync({
          address: OINKSAFE_ADDRESS,
          abi: OINKSAFE_ABI,
          functionName: 'withdraw',
          args: [lockId],
        });

        setCurrentTxHash(hash);
        setState('withdraw-pending');
        await publicClient.waitForTransactionReceipt({ hash });

        setState('success');
      } catch (err: unknown) {
        setErrorMessage(friendlyError(err));
        setState('error');
      }
    },
    [address, publicClient, writeContractAsync],
  );

  return { state, currentTxHash, errorMessage, executeWithdraw, reset };
}
