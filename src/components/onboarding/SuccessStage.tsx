import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Check, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CircleWallet, CircleTokenBalance } from "@/lib/circle";

const EXPLORER = "https://testnet.arcscan.app";

export function SuccessStage({
  wallet,
  balance,
  walletAlreadyExisted,
}: {
  wallet: CircleWallet | null;
  balance: CircleTokenBalance | null;
  walletAlreadyExisted: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!wallet) return;
    navigator.clipboard
      .writeText(wallet.address)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => undefined);
  };

  return (
    <div className="space-y-6 text-center">
      <div>
        <span className="text-5xl">🐷</span>
        <h1 className="mt-3 text-xl font-bold text-foreground">
          {walletAlreadyExisted ? "Welcome back!" : "Your wallet is ready!"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {walletAlreadyExisted
            ? "We found your existing OinkAI wallet."
            : "You're all set to start saving on OinkAI."}
        </p>
      </div>

      {wallet ? (
        <>
          <div className="space-y-1.5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Wallet Address
            </p>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5">
                <p className="break-all font-mono text-sm text-foreground">{wallet.address}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={copyAddress}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Copy address"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={`${EXPLORER}/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="View on Arcscan"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-5">
            <p className="text-sm font-medium text-muted-foreground">Balance</p>
            <p className="mt-1 text-3xl font-extrabold text-foreground">
              {balance?.amount ?? "0.00"}{" "}
              <span className="text-base font-semibold text-muted-foreground">
                {balance?.token.symbol ?? "USDC"}
              </span>
            </p>
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-border bg-secondary/30 p-5 text-sm text-muted-foreground">
          Your wallet is still being indexed — it'll show up on your dashboard in a moment.
        </p>
      )}

      <Button
        size="lg"
        asChild
        className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white transition-shadow hover:glow-purple"
      >
        <Link to="/dashboard">
          Go to Dashboard
          <ArrowRight className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
}
