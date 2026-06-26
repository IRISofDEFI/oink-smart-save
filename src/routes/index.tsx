import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Lock, LineChart, ArrowRight, Wallet } from "lucide-react";
import { Wordmark, PigLogo } from "@/components/PigLogo";
import { Button } from "@/components/ui/button";
import { useOink } from "@/lib/oink-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OinkAI — Save smarter with AI" },
      {
        name: "description",
        content:
          "OinkAI is your AI savings buddy. Lock USDC for a set time so you can't spend what you shouldn't — managed through a friendly chat.",
      },
      { property: "og:title", content: "OinkAI — Save smarter with AI" },
      {
        property: "og:description",
        content: "Lock USDC, chat to save, and watch your savings grow with OinkAI.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: MessageCircle,
    title: "Chat to Save",
    desc: "Just tell OinkAI what you want to do. No menus, no jargon — only a friendly conversation.",
  },
  {
    icon: Lock,
    title: "Lock USDC",
    desc: "Set aside USDC for a set time. It stays put until the day you chose, safe from impulse spending.",
  },
  {
    icon: LineChart,
    title: "Track Your Savings",
    desc: "See your balance, your locks, and how many days are left — all in one calm, clear place.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const { connect } = useOink();

  const handleConnect = () => {
    connect();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Wordmark />
        <Button
          variant="ghost"
          className="rounded-full font-semibold"
          onClick={handleConnect}
        >
          <Wallet className="h-4 w-4" />
          Connect
        </Button>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl overflow-hidden px-5 pb-10 pt-12 text-center sm:pt-20">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-card shadow-card">
          <PigLogo className="h-14 w-14" />
        </div>

        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
          Save smarter <span className="text-primary">with AI.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          OinkAI helps you lock USDC on Arc so you can't spend what you
          shouldn't. Think of it as a digital piggy bank — only smarter.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleConnect}
            className="h-14 rounded-full px-8 text-base font-semibold shadow-soft"
          >
            <Wallet className="h-5 w-5" />
            Connect Wallet
            <ArrowRight className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Your money, locked by you — until you're ready.
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border/70 bg-card p-6 shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-center text-sm text-muted-foreground">
        Made with care · OinkAI
      </footer>
    </div>
  );
}
