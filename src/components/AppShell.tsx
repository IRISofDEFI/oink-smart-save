import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MessageCircle } from "lucide-react";
import { type ReactNode } from "react";
import { Wordmark } from "@/components/PigLogo";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Savings", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessageCircle },
] as const;

export function AppShell({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link to="/dashboard">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            {/* desktop nav */}
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {action}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-28 pt-6 sm:pb-12">{children}</main>

      {/* mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-6 py-2">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
