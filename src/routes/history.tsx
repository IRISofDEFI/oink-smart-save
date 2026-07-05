import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useOinkHistory, type OinkEvent } from "@/hooks/useOinkHistory";
import { formatUsdcAmount } from "@/hooks/useOinkLocks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [{ title: "History — OinkAI" }],
  }),
  component: HistoryPage,
});

function truncateTxHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}

function EventRow({ event }: { event: OinkEvent }) {
  const isLock = event.type === "LockCreated";
  const amount = formatUsdcAmount(event.amount);
  const label = isLock
    ? `Locked ${amount} USDC for ${event.durationDays?.toString() ?? "?"} days`
    : `Withdrew ${amount} USDC`;

  return (
    <div className="flex items-center gap-4 border-b border-border py-4 last:border-0">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base",
          isLock
            ? "bg-gradient-brand shadow-[0_4px_20px_-4px_oklch(0.58_0.24_290_/_0.6)]"
            : "bg-[linear-gradient(120deg,oklch(0.50_0.18_150),oklch(0.60_0.15_170))] shadow-[0_4px_20px_-4px_oklch(0.55_0.18_155_/_0.5)]",
        )}
      >
        {isLock ? "🔒" : "🔓"}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {label}
          {!isLock && event.earlyWithdrawal && (
            <span className="ml-1.5 text-amber-400">(early)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">Block #{event.blockNumber.toString()}</p>
      </div>

      <a
        href={`https://testnet.arcscan.app/tx/${event.transactionHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <span className="font-mono">{truncateTxHash(event.transactionHash)}</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function HistoryPage() {
  const {
    events,
    isLoading,
    isError,
    error,
    loadingProgress,
    isConnected,
    wrongNetwork,
    refetch,
  } = useOinkHistory();

  const progressPct = Math.round(loadingProgress * 100);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              History 📜
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every lock. Every withdrawal. All onchain.
            </p>
          </div>

          {isConnected && !wrongNetwork && (
            <button
              onClick={refetch}
              disabled={isLoading}
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label="Refresh history"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
          )}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm">
          {/* Not connected */}
          {!isConnected && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="text-4xl">📜</span>
              <div>
                <p className="font-semibold text-foreground">
                  Connect wallet to see your history
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every onchain action will appear here.
                </p>
              </div>
              <ConnectButton label="Connect Wallet" />
            </div>
          )}

          {/* Wrong network */}
          {isConnected && wrongNetwork && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-4xl">🌐</span>
              <p className="font-semibold text-foreground">
                Switch to Arc Testnet to see your history
              </p>
            </div>
          )}

          {/* Loading — progress bar + skeleton rows */}
          {isConnected && !wrongNetwork && isLoading && (
            <div className="px-6 pb-4 pt-6">
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Loading history...</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-brand transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-border py-4 last:border-0"
                >
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-28 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isConnected && !wrongNetwork && !isLoading && isError && (
            <div className="space-y-2 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-red-400">
                Failed to load history.{" "}
                <button
                  onClick={refetch}
                  className="underline underline-offset-2 transition-opacity hover:opacity-70"
                >
                  Try again
                </button>
              </p>
              {error && (
                <p className="break-all font-mono text-xs text-red-400/60">{error.message}</p>
              )}
            </div>
          )}

          {/* Empty */}
          {isConnected && !wrongNetwork && !isLoading && !isError && events.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="text-4xl">🐷</span>
              <div>
                <p className="font-semibold text-foreground">No history yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your first lock will show up here 🐷
                </p>
              </div>
              <Link
                to="/dashboard"
                className="rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white transition-shadow hover:glow-purple"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {/* Event list */}
          {isConnected && !wrongNetwork && !isLoading && !isError && events.length > 0 && (
            <div className="px-6">
              {events.map((event) => (
                <EventRow
                  key={`${event.transactionHash}-${event.type}-${event.lockId.toString()}`}
                  event={event}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
