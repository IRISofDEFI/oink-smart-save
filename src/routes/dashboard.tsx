import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Lock,
  Eye,
  Download,
  MessageCircle,
  ArrowUp,
  Wallet,
  PiggyBank,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PigOrb } from "@/components/PigOrb";
import { NewLockModal } from "@/components/NewLockModal";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useOink } from "@/lib/oink-store";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { useOinkLocks, formatUsdcAmount, formatUnixToDate, daysRemaining } from "@/hooks/useOinkLocks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — OinkAI" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { connected, connect } = useOink();
  const {
    balance,
    isConnected,
    isLoading: balanceLoading,
    isFetching: balanceFetching,
    isError: balanceError,
    wrongNetwork,
    refetch: refetchBalance,
  } = useUsdcBalance();
  const {
    locks,
    totalLocked,
    isLoading: locksLoading,
    isError: locksError,
  } = useOinkLocks();
  const locksToShow = locks ? locks.slice(0, 12) : [];
  const navigate = useNavigate();
  const [lockOpen, setLockOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!connected) connect();
  }, [connected, connect]);

  const actions = [
    {
      icon: Lock,
      title: "Lock USDC",
      desc: "Set aside for safekeeping",
      onClick: () => setLockOpen(true),
    },
    {
      icon: Eye,
      title: "View My Locks",
      desc: "See active savings",
      onClick: () => navigate({ to: "/chat" }),
    },
    {
      icon: Download,
      title: "Withdraw",
      desc: "Released funds",
      onClick: () => navigate({ to: "/chat" }),
    },
    {
      icon: MessageCircle,
      title: "Ask OinkAI",
      desc: "Get help & insights",
      onClick: () => navigate({ to: "/chat" }),
    },
  ];

  const goChat = (text?: string) => {
    navigate({ to: "/chat" });
    void text;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-medium text-muted-foreground">Hey there 👋</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              What would you like to{" "}
              <span className="text-gradient">do today?</span>
            </h1>
          </div>
          <PigOrb className="hidden h-28 w-28 shrink-0 sm:block" />
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative flex items-center gap-4 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm">
            {/* Refresh button */}
            <button
              onClick={refetchBalance}
              disabled={!isConnected || wrongNetwork}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              aria-label="Refresh balance"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", balanceFetching && "animate-spin")} />
            </button>

            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-[0_8px_30px_-6px_oklch(0.58_0.24_290_/_0.7)]">
              <Wallet className="h-6 w-6" />
            </span>

            <div>
              <p className="text-sm font-medium text-muted-foreground">USDC Balance</p>

              {!isConnected && (
                <>
                  <p className="text-2xl font-extrabold text-foreground">—</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Connect wallet to see balance</p>
                </>
              )}

              {isConnected && wrongNetwork && (
                <>
                  <p className="text-2xl font-extrabold text-foreground">—</p>
                  <p className="mt-0.5 text-xs text-amber-400">Switch to Arc Testnet</p>
                </>
              )}

              {isConnected && !wrongNetwork && balanceLoading && (
                <Skeleton className="mt-1 h-8 w-32" />
              )}

              {isConnected && !wrongNetwork && !balanceLoading && balanceError && (
                <>
                  <p className="text-2xl font-extrabold text-foreground">—</p>
                  <p className="mt-0.5 text-xs text-red-400">Failed to load</p>
                </>
              )}

              {isConnected && !wrongNetwork && !balanceLoading && !balanceError && (
                <p className="text-2xl font-extrabold text-foreground">
                  {balance ?? "—"}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">USDC</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm glow-blue">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-[0_8px_30px_-6px_oklch(0.58_0.24_290_/_0.7)]">
              <PiggyBank className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Locked</p>

              {!isConnected && (
                <>
                  <p className="text-2xl font-extrabold text-foreground">—</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Connect wallet to see</p>
                </>
              )}

              {isConnected && wrongNetwork && (
                <>
                  <p className="text-2xl font-extrabold text-foreground">—</p>
                  <p className="mt-0.5 text-xs text-amber-400">Switch to Arc Testnet</p>
                </>
              )}

              {isConnected && !wrongNetwork && locksLoading && (
                <Skeleton className="mt-1 h-8 w-32" />
              )}

              {isConnected && !wrongNetwork && !locksLoading && locksError && (
                <>
                  <p className="text-2xl font-extrabold text-foreground">—</p>
                  <p className="mt-0.5 text-xs text-red-400">Failed to load</p>
                </>
              )}

              {isConnected && !wrongNetwork && !locksLoading && !locksError && (
                <p className="text-2xl font-extrabold text-foreground">
                  {totalLocked ?? "0.00"}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">USDC</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {actions.map((a) => (
            <button
              key={a.title}
              onClick={a.onClick}
              className="group flex items-center gap-4 rounded-3xl border border-border bg-card/60 p-6 text-left backdrop-blur-sm transition-all hover:-translate-y-1 hover:glow-blue"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-[0_8px_30px_-6px_oklch(0.58_0.24_290_/_0.7)]">
                <a.icon className="h-7 w-7" />
              </span>
              <span>
                <span className="block text-lg font-bold text-foreground">{a.title}</span>
                <span className="block text-sm text-muted-foreground">{a.desc}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Active Locks */}
        <div className="space-y-4">
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

          {/* Loading skeletons */}
          {isConnected && !wrongNetwork && locksLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-[132px] rounded-3xl" />
              <Skeleton className="h-[132px] rounded-3xl" />
            </div>
          )}

          {/* Error */}
          {isConnected && !wrongNetwork && !locksLoading && locksError && (
            <div className="rounded-3xl border border-border bg-card/40 py-8 text-center">
              <p className="text-sm text-red-400">Failed to load locks. Retrying automatically.</p>
            </div>
          )}

          {/* Loaded */}
          {isConnected && !wrongNetwork && !locksLoading && !locksError && locks !== null && (
            <>
              {locks.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card/40 py-14 text-center">
                  <span className="text-4xl">🐷</span>
                  <div>
                    <p className="font-semibold text-foreground">No active locks yet.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Lock some USDC to get started.
                    </p>
                  </div>
                  <NewLockModal
                    trigger={
                      <button className="rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white transition-shadow hover:glow-purple">
                        Create your first lock
                      </button>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {locksToShow.map((lock) => {
                      const days = daysRemaining(lock.unlockAt);
                      const expired = days === 0;
                      return (
                        <div
                          key={lock.id.toString()}
                          className={cn(
                            "group relative overflow-hidden rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1",
                            expired ? "hover:glow-purple" : "hover:glow-blue",
                          )}
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
                                expired
                                  ? "bg-[linear-gradient(120deg,oklch(0.58_0.24_300),oklch(0.65_0.18_330))]"
                                  : "bg-gradient-brand",
                              )}
                            >
                              {expired ? "Unlocked" : `${days}d left`}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {expired ? "Unlocked on " : "Unlocks "}
                              <span className="font-semibold text-foreground">
                                {formatUnixToDate(lock.unlockAt)}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {locks.length > 12 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Showing 12 of {locks.length} locks
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Chat input */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goChat(prompt);
            }}
            className="flex items-center gap-2 rounded-full border border-border bg-card/70 p-2 pl-5 backdrop-blur-sm focus-within:glow-blue"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask OinkAI anything..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white transition-shadow hover:glow-purple"
              aria-label="Send"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {["How can I save more?", "Show my active locks"].map((s) => (
              <button
                key={s}
                onClick={() => goChat(s)}
                className="rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile wallet indicator */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 px-4 py-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>
            <p className="font-mono text-sm font-semibold text-foreground">0xArc…7f3D</p>
          </div>
        </div>
      </div>

      <NewLockModal open={lockOpen} onOpenChange={setLockOpen} />
    </AppShell>
  );
}
