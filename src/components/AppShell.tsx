import { Link, useRouterState } from "@tanstack/react-router";
import {
  MessageCircle,
  LayoutDashboard,
  PiggyBank,
  History,
  Settings,
  Bell,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Wordmark } from "@/components/PigLogo";
import { CosmicBackground } from "@/components/PigOrb";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/savings", label: "Savings", icon: PiggyBank },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  children,
  showHeader = true,
}: {
  children: ReactNode;
  showHeader?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative min-h-screen bg-background">
      <CosmicBackground />

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar/60 px-4 py-6 backdrop-blur-xl md:flex">
          <Link to="/" className="px-2">
            <Wordmark />
          </Link>

          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {navItems.map((item, i) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={`${item.label}-${i}`}
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                    active
                      ? "bg-gradient-brand text-white glow-blue"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <ConnectedWallet />
        </aside>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          {showHeader && (
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/70 px-5 backdrop-blur-xl md:px-8">
              <Link to="/" className="md:hidden">
                <Wordmark />
              </Link>
              <div className="ml-auto flex items-center gap-3">
                {mounted && (
                  <ConnectButton
                    accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
                    chainStatus="icon"
                    showBalance={false}
                  />
                )}
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="h-10 w-10 rounded-full bg-gradient-brand glow-purple" aria-label="Profile" />
              </div>
            </header>
          )}

          <main className="flex-1 px-5 pb-28 pt-6 md:px-8 md:pb-10">{children}</main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/85 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.slice(0, 4).map((item, i) => {
            const active = pathname === item.to;
            return (
              <Link
                key={`m-${item.label}-${i}`}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    active && "bg-gradient-brand text-white glow-blue",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function ConnectedWallet() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const connected = mounted && isConnected;
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 px-4 py-3">
      {connected ? (
        <>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Connected Wallet</p>
            <p className="truncate font-mono text-sm font-semibold text-foreground">{displayAddress}</p>
          </div>
        </>
      ) : (
        <>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-zinc-500" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Wallet</p>
            <p className="truncate text-sm font-semibold text-muted-foreground">Not connected</p>
          </div>
        </>
      )}
    </div>
  );
}
