import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Lock, Wallet, Sparkles, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { NewLockModal } from "@/components/NewLockModal";
import { Button } from "@/components/ui/button";
import { useOink, daysRemaining, formatDate, type Lock as LockType } from "@/lib/oink-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Your Savings — OinkAI" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { connected, connect, balance, totalLocked, locks } = useOink();
  const navigate = useNavigate();

  // Auto-connect if user lands here directly (placeholder wallet behaviour)
  useEffect(() => {
    if (!connected) connect();
  }, [connected, connect]);

  return (
    <AppShell action={<ConnectChip />}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Hey there 👋
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Here's your savings
          </h1>
        </div>

        {/* Balance cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
            <div className="flex items-center gap-2 text-sm font-medium opacity-90">
              <Wallet className="h-4 w-4" /> Total balance
            </div>
            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <span className="ml-1 text-lg font-semibold opacity-80">USDC</span>
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lock className="h-4 w-4" /> Total locked
            </div>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
              {totalLocked.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <span className="ml-1 text-lg font-semibold text-muted-foreground">
                USDC
              </span>
            </p>
          </div>
        </div>

        {/* New lock CTA */}
        <NewLockModal
          trigger={
            <button className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary/40 bg-primary/5 py-5 text-base font-semibold text-primary transition-colors hover:bg-primary/10">
              + New Lock
            </button>
          }
        />

        {/* Active locks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Active locks</h2>
            <span className="text-sm text-muted-foreground">
              {locks.length} active
            </span>
          </div>

          {locks.length === 0 ? (
            <div className="rounded-3xl border border-border/70 bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No locks yet. Tap “New Lock” to start saving.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {locks.map((lock) => (
                <LockCard key={lock.id} lock={lock} />
              ))}
            </ul>
          )}
        </div>

        {/* Chat nudge */}
        <button
          onClick={() => navigate({ to: "/chat" })}
          className="flex w-full items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-foreground">
              Ask OinkAI
            </span>
            <span className="block text-sm text-muted-foreground">
              “Lock 5 USDC for 30 days” — just chat.
            </span>
          </span>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </AppShell>
  );
}

function ConnectChip() {
  return (
    <Button className="rounded-full font-semibold shadow-soft">
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">0x7a…3f2</span>
      <span className="sm:hidden">Wallet</span>
    </Button>
  );
}

function LockCard({ lock }: { lock: LockType }) {
  const left = daysRemaining(lock.unlockAt);
  const total = lock.durationDays;
  const progress = Math.min(100, ((total - left) / total) * 100);
  const ready = left === 0;

  return (
    <li className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold text-foreground">
              {lock.amount.toLocaleString()} USDC
            </p>
            <p className="text-xs text-muted-foreground">
              Unlocks {formatDate(lock.unlockAt)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-lg font-extrabold ${ready ? "text-primary" : "text-foreground"}`}
          >
            {ready ? "Ready" : left}
          </p>
          <p className="text-xs text-muted-foreground">
            {ready ? "to unlock" : left === 1 ? "day left" : "days left"}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </li>
  );
}
