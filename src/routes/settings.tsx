import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";

const ARC_CHAIN_ID = 5042002;
const CONTRACT_ADDRESS = "0x8CA4e4037d853Fa63Ee96A100631d21F4daC29E6";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — OinkAI" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const connected = mounted && isConnected;
  const onArc = chainId === ARC_CHAIN_ID;

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => undefined);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Settings ⚙️
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your wallet and app info.
          </p>
        </div>

        {/* Section 1: Wallet */}
        <section className="space-y-6 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-foreground">Wallet</h2>

          {!connected ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Connect wallet to view your settings
              </p>
              <ConnectButton label="Connect Wallet" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Connected Address */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Connected Address
                </p>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5">
                    <p className="break-all font-mono text-sm text-foreground">{address}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={copyAddress}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Copy address"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <a
                      href={`https://testnet.arcscan.app/address/${address}`}
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

              {/* Network */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Network
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                    onArc
                      ? "bg-green-500/15 text-green-400"
                      : "bg-amber-500/15 text-amber-400",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      onArc ? "bg-green-400" : "bg-amber-400",
                    )}
                  />
                  {onArc ? "Arc Testnet" : "Wrong Network"}
                </span>
              </div>

              {/* Disconnect */}
              <div className="pt-1">
                <button
                  onClick={() => disconnect()}
                  className="rounded-xl border border-border bg-card/40 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: About */}
        <section className="space-y-3 rounded-3xl border border-border bg-card/40 p-6 backdrop-blur-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            About OinkAI
          </h2>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">OinkAI v0.1 (beta)</p>
            <a
              href="https://github.com/IRISofDEFI/oink-smart-save"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              View source on GitHub
            </a>
            <a
              href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              View contract on Arcscan
            </a>
            <p>
              Built solo by{" "}
              <a
                href="https://x.com/Iris_of_DeFi"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                @Iris_of_DeFi
              </a>
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
