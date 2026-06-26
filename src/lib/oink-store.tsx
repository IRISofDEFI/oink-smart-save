import { createContext, useContext, useState, type ReactNode } from "react";

export interface Lock {
  id: string;
  amount: number;
  durationDays: number;
  createdAt: number; // epoch ms
  unlockAt: number; // epoch ms
}

interface OinkState {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  balance: number;
  locks: Lock[];
  addLock: (amount: number, durationDays: number) => void;
  totalLocked: number;
}

const OinkContext = createContext<OinkState | null>(null);

const DAY = 24 * 60 * 60 * 1000;

const seedLocks = (): Lock[] => {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      amount: 50,
      durationDays: 30,
      createdAt: now - 12 * DAY,
      unlockAt: now + 18 * DAY,
    },
    {
      id: "seed-2",
      amount: 120,
      durationDays: 90,
      createdAt: now - 20 * DAY,
      unlockAt: now + 70 * DAY,
    },
    {
      id: "seed-3",
      amount: 25,
      durationDays: 7,
      createdAt: now - 5 * DAY,
      unlockAt: now + 2 * DAY,
    },
  ];
};

export function OinkProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [balance] = useState(340.5);
  const [locks, setLocks] = useState<Lock[]>(seedLocks);

  const addLock = (amount: number, durationDays: number) => {
    const now = Date.now();
    setLocks((prev) => [
      {
        id: `lock-${now}`,
        amount,
        durationDays,
        createdAt: now,
        unlockAt: now + durationDays * DAY,
      },
      ...prev,
    ]);
  };

  const totalLocked = locks.reduce((sum, l) => sum + l.amount, 0);

  return (
    <OinkContext.Provider
      value={{
        connected,
        connect: () => setConnected(true),
        disconnect: () => setConnected(false),
        balance,
        locks,
        addLock,
        totalLocked,
      }}
    >
      {children}
    </OinkContext.Provider>
  );
}

export function useOink() {
  const ctx = useContext(OinkContext);
  if (!ctx) throw new Error("useOink must be used within OinkProvider");
  return ctx;
}

export function daysRemaining(unlockAt: number): number {
  return Math.max(0, Math.ceil((unlockAt - Date.now()) / DAY));
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
