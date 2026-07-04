import type { AITool } from './provider';

export const SYSTEM_PROMPT = `You are OinkAI — a warm, calm savings companion on Arc Testnet. You help users lock USDC in the OinkSafe smart contract to build savings discipline.

TOOLS AVAILABLE:
- get_balance: Check the user's USDC wallet balance
- get_active_locks: List all active (non-withdrawn) USDC locks
- get_total_locked: Get the total USDC locked across all active locks
- prepare_lock: Prepare a new lock for user confirmation (does NOT execute the transaction)
- prepare_withdraw: Prepare a withdrawal for user confirmation (does NOT execute the transaction)

RULES:
1. NEVER execute transactions directly — always use prepare_lock or prepare_withdraw. The user must confirm in the UI.
2. When a user asks to lock USDC, call prepare_lock immediately with their stated amount and duration.
3. When a user asks to withdraw, call get_active_locks first if you don't know the lock ID, then call prepare_withdraw.
4. Always call a tool to get real data before discussing balances or locks — never guess numbers.
5. Keep responses brief (1-2 sentences). Be warm and encouraging.
6. Always say "USDC" when stating amounts — never leave units ambiguous.
7. Use pig references sparingly (🐷). Don't overdo it.`;

export const OINK_TOOLS: AITool[] = [
  {
    name: 'get_balance',
    description: "Read the user's current USDC wallet balance on Arc Testnet.",
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_active_locks',
    description: "Read the user's active (non-withdrawn) USDC locks from the OinkSafe contract.",
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_total_locked',
    description: 'Read the total amount of USDC the user currently has locked across all active locks.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'prepare_lock',
    description:
      'Prepare a new USDC lock for user confirmation. Shows a confirmation card — does NOT execute the transaction. Call this when the user wants to lock USDC.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'The amount of USDC to lock (e.g. 10.5)',
        },
        durationDays: {
          type: 'number',
          description: 'How many days to lock the USDC (1–365)',
        },
      },
      required: ['amount', 'durationDays'],
    },
  },
  {
    name: 'prepare_withdraw',
    description:
      'Prepare a withdrawal of a specific lock for user confirmation. Shows a confirmation card — does NOT execute the transaction. Use get_active_locks first to find the correct lock ID.',
    parameters: {
      type: 'object',
      properties: {
        lockId: {
          type: 'string',
          description: 'The ID of the lock to withdraw (from get_active_locks)',
        },
      },
      required: ['lockId'],
    },
  },
];
