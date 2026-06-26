import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Eye, Download, MessageCircle, ArrowUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PigOrb } from "@/components/PigOrb";
import { NewLockModal } from "@/components/NewLockModal";
import { useOink } from "@/lib/oink-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — OinkAI" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { connected, connect } = useOink();
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
