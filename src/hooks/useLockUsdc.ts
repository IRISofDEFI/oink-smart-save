import { useState, useCallback } from 'react';
import { parseUnits } from 'viem';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { OINKSAFE_ADDRESS, USDC_ADDRESS } from '@/lib/wagmi';
import { OINKSAFE_ABI, USDC_ABI } from '@/lib/abis';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export type LockState =
  | 'idle'
  | 'checking-allowance'
  | 'approving'
  | 'approve-pending'
  | 'locking'
  | 'lock-pending'
  | 'success'
  | 'error';

export interface UseLockUsdcResult {
  state: LockState;
  currentTxHash: `0x${string}` | null;
  errorMessage: string | null;
  approvalSkipped: boolean;
  executeLock: (amountInUsdc: string, durationDays: number) => Promise<void>;
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

export function useLockUsdc(): UseLockUsdcResult {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [state, setState] = useState<LockState>('idle');
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [approvalSkipped, setApprovalSkipped] = useState(false);

  // Only used imperatively via refetch — disabled to avoid auto-fetching
  const { refetch: fetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address ?? ZERO_ADDRESS, OINKSAFE_ADDRESS],
    query: { enabled: false },
  });

  const reset = useCallback(() => {
    setState('idle');
    setCurrentTxHash(null);
    setErrorMessage(null);
    setApprovalSkipped(false);
  }, []);

  const executeLock = useCallback(
    async (amountInUsdc: string, durationDays: number) => {
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

      // Clamp to 6 decimal places before converting to avoid parseUnits overflow
      const amountStr = parseFloat(amountInUsdc).toFixed(6);
      const amountInBaseUnits = parseUnits(amountStr, 6);

      if (amountInBaseUnits === 0n) {
        setErrorMessage('Amount is too small');
        setState('error');
        return;
      }

      try {
        // ── Step 1: read current allowance ──────────────────────────────────
        setState('checking-allowance');
        setCurrentTxHash(null);
        const { data: currentAllowance } = await fetchAllowance();

        const needsApproval =
          currentAllowance === undefined || currentAllowance < amountInBaseUnits;
        setApprovalSkipped(!needsApproval);

        // ── Step 2: approve USDC if needed ──────────────────────────────────
        if (needsApproval) {
          setState('approving');
          const approveHash = await writeContractAsync({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [OINKSAFE_ADDRESS, amountInBaseUnits],
          });
          setCurrentTxHash(approveHash);
          setState('approve-pending');
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        // ── Step 3: lock ─────────────────────────────────────────────────────
        setState('locking');
        setCurrentTxHash(null);
        const lockHash = await writeContractAsync({
          address: OINKSAFE_ADDRESS,
          abi: OINKSAFE_ABI,
          functionName: 'lock',
          args: [amountInBaseUnits, BigInt(durationDays)],
        });
        setCurrentTxHash(lockHash);
        setState('lock-pending');
        await publicClient.waitForTransactionReceipt({ hash: lockHash });

        setState('success');
      } catch (err: unknown) {
        setErrorMessage(friendlyError(err));
        setState('error');
      }
    },
    [address, publicClient, writeContractAsync, fetchAllowance],
  );

  return { state, currentTxHash, errorMessage, approvalSkipped, executeLock, reset };
}
