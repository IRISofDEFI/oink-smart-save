import { useState, useCallback, useEffect } from 'react';
import { getAIProvider } from '@/lib/ai';
import { OINK_TOOLS, SYSTEM_PROMPT } from '@/lib/ai/tools';
import type { AIProvider, ChatMessage, AIToolResult } from '@/lib/ai/provider';
import { useUsdcBalance } from './useUsdcBalance';
import {
  useOinkLocks,
  formatUsdcAmount,
  formatUnixToDate,
  daysRemaining,
  isLockUnlocked,
  type OinkLock,
} from './useOinkLocks';
import { useLockUsdc } from './useLockUsdc';
import { useWithdrawLock } from './useWithdrawLock';

// ── Public types ───────────────────────────────────────────────────────────

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type LockPreview = {
  type: 'lock';
  amount: string;
  durationDays: number;
  unlockDate: string;
};

export type WithdrawPreview = {
  type: 'withdraw';
  lockId: bigint;
  lockIdStr: string;
  amount: string;
  isEarly: boolean;
};

export type PendingAction = LockPreview | WithdrawPreview;

export interface UseOinkAgentResult {
  messages: DisplayMessage[];
  isThinking: boolean;
  isConfirming: boolean;
  pendingAction: PendingAction | null;
  sendMessage: (text: string) => void;
  confirmAction: () => void;
  cancelAction: () => void;
  resetConversation: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: DisplayMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I'm OinkAI. I'm here to help you save with calm and clarity. Tell me what you'd like to do, or tap a suggestion below.",
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function executeAgentTool(
  tc: AIToolResult,
  ctx: { balance: string | null; locks: OinkLock[] | null; totalLocked: string | null },
): unknown {
  switch (tc.name) {
    case 'get_balance':
      return { balance: ctx.balance ?? '0.00', unit: 'USDC' };

    case 'get_active_locks':
      return {
        count: ctx.locks?.length ?? 0,
        locks: (ctx.locks ?? []).map(l => ({
          id: l.id.toString(),
          amount: formatUsdcAmount(l.amount),
          durationDays: Number(l.durationDays),
          unlockDate: formatUnixToDate(l.unlockAt),
          daysRemaining: daysRemaining(l.unlockAt),
          isUnlocked: isLockUnlocked(l.unlockAt),
        })),
      };

    case 'get_total_locked':
      return { totalLocked: ctx.totalLocked ?? '0.00', unit: 'USDC' };

    case 'prepare_lock': {
      const amount = Number(tc.args.amount);
      const duration = Number(tc.args.durationDays);
      const userBalance = parseFloat(ctx.balance ?? '0');
      if (isNaN(amount) || amount <= 0) return { error: 'Amount must be greater than 0.' };
      if (amount > userBalance) {
        return { error: `Insufficient balance — you have ${ctx.balance ?? '0'} USDC but tried to lock ${amount} USDC.` };
      }
      if (isNaN(duration) || duration < 1 || duration > 365) {
        return { error: 'Duration must be between 1 and 365 days.' };
      }
      const unlockDate = new Date(Date.now() + duration * 86_400_000).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return { amount: amount.toString(), durationDays: duration, unlockDate, requiresConfirmation: true };
    }

    case 'prepare_withdraw': {
      const lockId = String(tc.args.lockId);
      const lock = ctx.locks?.find(l => l.id.toString() === lockId);
      if (!lock) {
        return { error: `Lock #${lockId} not found. Use get_active_locks to see available lock IDs.` };
      }
      return {
        lockId,
        amount: formatUsdcAmount(lock.amount),
        durationDays: Number(lock.durationDays),
        unlockDate: formatUnixToDate(lock.unlockAt),
        isEarly: !isLockUnlocked(lock.unlockAt),
        requiresConfirmation: true,
      };
    }

    default:
      return { error: `Unknown tool: ${tc.name}` };
  }
}

function buildPendingAction(
  tc: AIToolResult,
  result: unknown,
  locks: OinkLock[] | null,
): PendingAction | null {
  if (tc.name === 'prepare_lock') {
    const r = result as { amount?: string; durationDays?: number; unlockDate?: string; error?: string };
    if (r.error || !r.amount || r.durationDays === undefined || !r.unlockDate) return null;
    return { type: 'lock', amount: r.amount, durationDays: r.durationDays, unlockDate: r.unlockDate };
  }
  if (tc.name === 'prepare_withdraw') {
    const r = result as { lockId?: string; amount?: string; isEarly?: boolean; error?: string };
    if (r.error || !r.lockId) return null;
    const lock = locks?.find(l => l.id.toString() === r.lockId);
    if (!lock) return null;
    return {
      type: 'withdraw',
      lockId: lock.id,
      lockIdStr: r.lockId,
      amount: r.amount ?? '0.00',
      isEarly: r.isEarly ?? false,
    };
  }
  return null;
}

async function runAgentLoop(
  provider: AIProvider,
  messages: ChatMessage[],
  ctx: { balance: string | null; locks: OinkLock[] | null; totalLocked: string | null },
): Promise<{ historyMessages: ChatMessage[]; assistantText: string; pendingAction: PendingAction | null }> {
  const current = [...messages];
  let assistantText = '';
  let pendingAction: PendingAction | null = null;

  // Capped at 5 round-trips: tool calls resolve in 1-2 turns in practice: this is a
  // backstop against a runaway loop, not an expected depth.
  for (let i = 0; i < 5; i++) {
    const response = await provider.chat(current, OINK_TOOLS);

    const assistantHistMsg: ChatMessage = { role: 'assistant', content: response.message };
    if (response.toolCalls?.length) {
      assistantHistMsg.tool_calls = response.toolCalls.map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: JSON.stringify(tc.args) },
      }));
    }
    current.push(assistantHistMsg);

    if (!response.toolCalls?.length) {
      assistantText = response.message;
      break;
    }

    for (const tc of response.toolCalls) {
      const result = executeAgentTool(tc, ctx);
      const pa = buildPendingAction(tc, result, ctx.locks);
      if (pa) pendingAction = pa;

      current.push({
        role: 'tool',
        content: JSON.stringify(result),
        tool_call_id: tc.id,
      });
    }

    // A prepare_* tool needs user confirmation before continuing, so get the
    // AI's narration of the pending action and stop here rather than looping.
    if (pendingAction) {
      const finalResp = await provider.chat(current, OINK_TOOLS);
      assistantText = finalResp.message;
      current.push({ role: 'assistant', content: assistantText });
      break;
    }
  }

  return { historyMessages: current, assistantText, pendingAction };
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useOinkAgent(): UseOinkAgentResult {
  const { balance, isConnected, wrongNetwork, refetch: refetchBalance } = useUsdcBalance();
  const { locks, totalLocked, refetch: refetchLocks } = useOinkLocks();
  const lockUsdc = useLockUsdc();
  const withdrawLock = useWithdrawLock();

  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [internalHistory, setInternalHistory] = useState<ChatMessage[]>([
    { role: 'system', content: SYSTEM_PROMPT },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<PendingAction | null>(null);

  const addAiMsg = (content: string) => {
    setDisplayMessages(prev => [...prev, { id: makeId(), role: 'assistant', content }]);
  };

  // Watch lock tx outcome
  useEffect(() => {
    if (!confirmingAction || confirmingAction.type !== 'lock') return;
    if (lockUsdc.state === 'success') {
      const a = confirmingAction;
      addAiMsg(
        `Done! I've locked ${a.amount} USDC for ${a.durationDays} days — your funds are safe until ${a.unlockDate} 🐷`,
      );
      setIsConfirming(false);
      setConfirmingAction(null);
      refetchBalance();
      refetchLocks();
      setTimeout(() => lockUsdc.reset(), 200);
    } else if (lockUsdc.state === 'error') {
      const msg = lockUsdc.errorMessage;
      addAiMsg(
        msg === 'Transaction cancelled'
          ? "No problem — I've cancelled that lock. Anything else?"
          : `That didn't go through: ${msg ?? 'something went wrong'}. Want to try again?`,
      );
      setIsConfirming(false);
      setConfirmingAction(null);
      setTimeout(() => lockUsdc.reset(), 200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockUsdc.state, lockUsdc.errorMessage, confirmingAction]);

  // Watch withdraw tx outcome
  useEffect(() => {
    if (!confirmingAction || confirmingAction.type !== 'withdraw') return;
    if (withdrawLock.state === 'success') {
      const a = confirmingAction;
      addAiMsg(
        a.isEarly
          ? `Done — withdrew ${a.amount} USDC early. Your wallet is back up by ${a.amount} USDC.`
          : `Done — withdrew ${a.amount} USDC! Great job saving for the full duration 🎉`,
      );
      setIsConfirming(false);
      setConfirmingAction(null);
      refetchBalance();
      refetchLocks();
      setTimeout(() => withdrawLock.reset(), 200);
    } else if (withdrawLock.state === 'error') {
      const msg = withdrawLock.errorMessage;
      addAiMsg(
        msg === 'Transaction cancelled'
          ? "No problem — withdrawal cancelled. Your funds stay safe in the lock."
          : `That didn't go through: ${msg ?? 'something went wrong'}. Want to try again?`,
      );
      setIsConfirming(false);
      setConfirmingAction(null);
      setTimeout(() => withdrawLock.reset(), 200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawLock.state, withdrawLock.errorMessage, confirmingAction]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking || isConfirming || !!pendingAction) return;

      setDisplayMessages(prev => [...prev, { id: makeId(), role: 'user', content: trimmed }]);

      if (!isConnected) {
        setDisplayMessages(prev => [...prev, {
          id: makeId(),
          role: 'assistant',
          content: "Please connect your wallet first — I need it to access your on-chain data 🐷",
        }]);
        return;
      }
      if (wrongNetwork) {
        setDisplayMessages(prev => [...prev, {
          id: makeId(),
          role: 'assistant',
          content: "Please switch to Arc Testnet — that's where your savings live 🐷",
        }]);
        return;
      }

      setIsThinking(true);
      const newHistory: ChatMessage[] = [...internalHistory, { role: 'user', content: trimmed }];

      try {
        let provider: AIProvider;
        try {
          provider = getAIProvider();
        } catch {
          throw new Error('GROQ_API_KEY not configured — check your .env file');
        }

        const { historyMessages, assistantText, pendingAction: newPendingAction } =
          await runAgentLoop(provider, newHistory, { balance, locks, totalLocked });

        setInternalHistory(historyMessages);
        if (assistantText) {
          setDisplayMessages(prev => [...prev, { id: makeId(), role: 'assistant', content: assistantText }]);
        }
        if (newPendingAction) setPendingAction(newPendingAction);
      } catch (err) {
        const msg = String(err);
        let errorText = "Sorry, something went wrong. Please try again.";
        if (msg.includes('rate limit') || msg.includes('429')) {
          errorText = "OinkAI is a little overwhelmed right now — wait a moment and try again 🐷";
        } else if (msg.includes('configured') || msg.includes('GROQ_API_KEY')) {
          errorText = "OinkAI isn't set up yet — check your .env file for VITE_GROQ_API_KEY.";
        }
        setDisplayMessages(prev => [...prev, { id: makeId(), role: 'assistant', content: errorText }]);
        console.error('[OinkAgent]', err);
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, isConfirming, pendingAction, isConnected, wrongNetwork, internalHistory, balance, locks, totalLocked],
  );

  const confirmAction = useCallback(() => {
    if (!pendingAction || isConfirming) return;
    setIsConfirming(true);
    setConfirmingAction(pendingAction);
    setPendingAction(null);

    if (pendingAction.type === 'lock') {
      void lockUsdc.executeLock(pendingAction.amount, pendingAction.durationDays);
    } else {
      void withdrawLock.executeWithdraw(pendingAction.lockId);
    }
  }, [pendingAction, isConfirming, lockUsdc, withdrawLock]);

  const cancelAction = useCallback(() => {
    if (!pendingAction) return;
    const type = pendingAction.type;
    setPendingAction(null);
    setDisplayMessages(prev => [...prev, {
      id: makeId(),
      role: 'assistant',
      content:
        type === 'lock'
          ? "No problem — I've cancelled that lock. Anything else you'd like to do?"
          : "Got it — withdrawal cancelled. Your funds stay safely in the lock.",
    }]);
  }, [pendingAction]);

  const resetConversation = useCallback(() => {
    setDisplayMessages([WELCOME_MESSAGE]);
    setInternalHistory([{ role: 'system', content: SYSTEM_PROMPT }]);
    setPendingAction(null);
    setIsThinking(false);
    setIsConfirming(false);
    setConfirmingAction(null);
  }, []);

  return {
    messages: displayMessages,
    isThinking,
    isConfirming,
    pendingAction,
    sendMessage,
    confirmAction,
    cancelAction,
    resetConversation,
  };
}
