import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { NewLockModal } from "@/components/NewLockModal";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useOinkLocks,
  formatUsdcAmount,
  formatUnixToDate,
  daysRemaining,
  isLockUnlocked,
} from "@/hooks/useOinkLocks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [{ title: "Savings — OinkAI" }],
  }),
  component: Savings,
});

function Savings() {
  const {
    locks,
    completedLocks,
    totalLocked,
    isConnected,
    isLoading,
    isError,
    wrongNetwork,
    refetch,
  } = useOinkLocks();

  // Sum amounts across active + completed for "Total Ever Locked"
  const allLocks = [...(locks ?? []), ...(completedLocks ?? [])];
  const totalEverLocked =
    locks !== null && completedLocks !== null
      ? formatUsdcAmount(allLocks.reduce((sum, l) => sum + l.amount, 0n))
      : null;

  const dataReady = isConnected && !wrongNetwork && !isLoading && !isError;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Your Savings 🐷
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every USDC you've locked. Every one you've released.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Currently Locked */}
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-xl shadow-[0_8px_30px_-6px_oklch(0.58_0.24_290_/_0.7)]">
              🔒
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Currently Locked</p>
              {!isConnected || wrongNetwork ? (
                <p className="text-2xl font-extrabold text-foreground">—</p>
              ) : isLoading ? (
                <Skeleton className="mt-1 h-8 w-28" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground">
                  {totalLocked ?? "0.00"}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">USDC</span>
                </p>
              )}
            </div>
          </div>

          {/* Total Ever Locked */}
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm glow-blue">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-xl shadow-[0_8px_30px_-6px_oklch(0.58_0.24_290_/_0.7)]">
              📊
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Ever Locked</p>
              {!isConnected || wrongNetwork ? (
                <p className="text-2xl font-extrabold text-foreground">—</p>
              ) : isLoading || completedLocks === null ? (
                <Skeleton className="mt-1 h-8 w-28" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground">
                  {totalEverLocked ?? "0.00"}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">USDC</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Active Locks ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Active Locks</h2>
            {locks !== null && locks.length > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-brand px-2 text-xs font-bold text-white">
                {locks.length}
              </span>
            )}
          </div>

          {/* Not connected */}
          {!isConnected && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card/40 py-14 text-center">
              <span className="text-4xl">🔒</span>
              <div>
                <p className="font-semibold text-foreground">Connect your wallet to see your locks</p>
                <p className="mt-1 text-sm text-muted-foreground">Your savings are waiting for you.</p>
              </div>
              <ConnectButton label="Connect Wallet" />
            </div>
          )}

          {/* Wrong network */}
          {isConnected && wrongNetwork && (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card/40 py-14 text-center">
              <span className="text-4xl">🌐</span>
              <p className="font-semibold text-foreground">Switch to Arc Testnet to see your locks</p>
            </div>
          )}

          {/* Loading */}
          {isConnected && !wrongNetwork && isLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-[160px] rounded-3xl" />
              <Skeleton className="h-[160px] rounded-3xl" />
            </div>
          )}

          {/* Error */}
          {isConnected && !wrongNetwork && !isLoading && isError && (
            <div className="rounded-3xl border border-border bg-card/40 py-8 text-center">
              <p className="text-sm text-red-400">Failed to load locks. Retrying automatically.</p>
            </div>
          )}

          {/* Loaded — empty */}
          {dataReady && locks !== null && locks.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card/40 py-14 text-center">
              <span className="text-4xl">🐷</span>
              <div>
                <p className="font-semibold text-foreground">No active locks right now.</p>
                <p className="mt-1 text-sm text-muted-foreground">Go make one 🐷</p>
              </div>
              <NewLockModal
                onSuccess={refetch}
                trigger={
                  <button className="rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white transition-shadow hover:glow-purple">
                    Create your first lock
                  </button>
                }
              />
            </div>
          )}

          {/* Loaded — cards */}
          {dataReady && locks !== null && locks.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {locks.map((lock) => {
                const days = daysRemaining(lock.unlockAt);
                const unlocked = isLockUnlocked(lock.unlockAt);
                return (
                  <div
                    key={lock.id.toString()}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:glow-blue"
                  >
                    <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-brand opacity-0 blur-2xl transition-opacity group-hover:opacity-10" />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-3xl font-extrabold text-foreground">
                          {formatUsdcAmount(lock.amount)}
                          <span className="ml-1 text-base font-semibold text-muted-foreground">
                            USDC
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {lock.durationDays.toString()}-day lock
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white",
                          unlocked
                            ? "bg-[linear-gradient(120deg,oklch(0.58_0.24_300),oklch(0.65_0.18_330))]"
                            : "bg-gradient-brand",
                        )}
                      >
                        {unlocked ? "Unlocked" : `${days}d left`}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {unlocked ? "Unlocked on " : "Unlocks "}
                        <span className="font-semibold text-foreground">
                          {formatUnixToDate(lock.unlockAt)}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Completed Locks ──────────────────────────────────────────── */}
        {/* Only render once the user has at least one completed lock */}
        {isConnected && !wrongNetwork && completedLocks !== null && completedLocks.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">Completed Locks</h2>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-2 text-xs font-bold text-muted-foreground">
                {completedLocks.length}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {completedLocks.map((lock) => (
                <div
                  key={lock.id.toString()}
                  className="rounded-3xl border border-border bg-card/40 p-6 opacity-70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-3xl font-extrabold text-foreground">
                        {formatUsdcAmount(lock.amount)}
                        <span className="ml-1 text-base font-semibold text-muted-foreground">
                          USDC
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lock.durationDays.toString()}-day lock
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold",
                        lock.earlyWithdrawal
                          ? "border-amber-500/40 text-amber-400"
                          : "border-green-500/40 text-green-400",
                      )}
                    >
                      {lock.earlyWithdrawal ? "Withdrew early" : "Completed ✓"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                    {/* Withdrawal date not stored on-chain; showing unlock date for context */}
                    <span>
                      {lock.earlyWithdrawal ? "Was locked until " : "Locked until "}
                      <span className="font-semibold text-foreground">
                        {formatUnixToDate(lock.unlockAt)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
