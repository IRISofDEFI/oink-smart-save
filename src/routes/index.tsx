import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import {
  MessageCircle,
  Lock,
  LineChart,
  ArrowRight,
  Wallet,
  Zap,
  ShieldCheck,
  Brain,
  PiggyBank,
  CircleCheck,
} from "lucide-react";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Wordmark } from "@/components/PigLogo";
import { PigOrb, CosmicBackground } from "@/components/PigOrb";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OinkAI — Save smarter with AI" },
      {
        name: "description",
        content:
          "OinkAI helps you lock USDC on Arc so you can't spend what you shouldn't. Your AI savings companion — calm, secure, and a little bit cosmic.",
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
    desc: "Set aside USDC for a chosen duration. It stays put until the day you chose, safe from impulse spending.",
  },
  {
    icon: LineChart,
    title: "Track Your Savings",
    desc: "See your balance, your locks, and how many days are left — all in one calm, clear place.",
  },
];

const steps = [
  {
    icon: Wallet,
    title: "Connect your wallet",
    desc: "One click to connect any EVM wallet. Your keys stay yours — we never touch your funds.",
  },
  {
    icon: PiggyBank,
    title: "Lock USDC by chatting",
    desc: "Just tell OinkAI how much to lock and for how long. It handles the smart contract call. You confirm the transaction. Done.",
  },
  {
    icon: CircleCheck,
    title: "Track and withdraw",
    desc: "See every lock, every countdown, every completed savings goal. Withdraw any time — but the app will nudge you to stay disciplined.",
  },
];

const pillars = [
  {
    icon: Zap,
    title: "On Arc Chain",
    desc: "Fast. Secure. Low fees.",
  },
  {
    icon: ShieldCheck,
    title: "Your Data, Your Control",
    desc: "Non-custodial by design.",
  },
  {
    icon: Brain,
    title: "AI That Understands You",
    desc: "Personalized. Private. Powerful.",
  },
];

const navLinks = [
  { label: "Home", id: "home" },
  { label: "Features", id: "features" },
  { label: "How it Works", id: "how-it-works" },
  { label: "About", id: "about" },
];

function Landing() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [mounted, setMounted] = useState(false);
  const [pendingNav, setPendingNav] = useState(false);

  useEffect(() => setMounted(true), []);

  // Once wallet connects after user clicked "Launch App", complete the navigation
  useEffect(() => {
    if (pendingNav && isConnected) {
      setPendingNav(false);
      void navigate({ to: "/dashboard" });
    }
  }, [pendingNav, isConnected, navigate]);

  const handleLaunchApp = () => {
    if (isConnected) {
      void navigate({ to: "/dashboard" });
    } else {
      setPendingNav(true);
      openConnectModal?.();
    }
  };

  const handleNavClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <CosmicBackground />

      {/* Nav */}
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => handleNavClick(l.id)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Top-right: Connect Wallet / connected address */}
        {mounted ? (
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal: openConnect, mounted: rbMounted }) => {
              const ready = rbMounted;
              const connected = ready && account && chain;
              return (
                <div
                  aria-hidden={!ready}
                  style={!ready ? { opacity: 0, pointerEvents: "none", userSelect: "none" } : undefined}
                >
                  {!connected ? (
                    <Button
                      onClick={openConnect}
                      className="rounded-full bg-gradient-brand px-5 font-semibold text-white transition-shadow hover:glow-purple"
                    >
                      <Wallet className="h-4 w-4" />
                      Connect Wallet
                    </Button>
                  ) : chain.unsupported ? (
                    <Button
                      onClick={openChainModal}
                      className="rounded-full border border-amber-500/40 bg-amber-500/10 px-5 font-semibold text-amber-400 transition-colors hover:bg-amber-500/20"
                    >
                      Wrong Network
                    </Button>
                  ) : (
                    <Button
                      onClick={openAccountModal}
                      className="rounded-full border border-border bg-card/80 px-5 font-mono text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
                    >
                      {account.displayName}
                    </Button>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        ) : (
          <Button
            disabled
            className="rounded-full bg-gradient-brand px-5 font-semibold text-white opacity-70"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative mx-auto max-w-4xl px-5 pb-16 pt-10 text-center sm:pt-16">
        <PigOrb priority className="mx-auto mb-10 h-44 w-44 sm:h-56 sm:w-56" />

        <h1 className="mx-auto max-w-2xl text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
          Save smarter <span className="text-gradient">with AI.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          OinkAI helps you lock USDC on Arc so you can't spend what you
          shouldn't. Think of it as a digital piggy bank — only smarter.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleLaunchApp}
            className="h-14 rounded-full bg-gradient-brand px-8 text-base font-semibold text-white transition-shadow hover:glow-purple"
          >
            Launch App
            <ArrowRight className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Your money, locked by you — until you're ready.
          </span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-border bg-card/60 p-7 backdrop-blur-sm transition-all hover:-translate-y-1 hover:glow-blue"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-[0_8px_30px_-6px_oklch(0.58_0.24_290_/_0.7)]">
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            How it <span className="text-gradient">Works</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Save smarter in three simple steps
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-4">
          {steps.map((s, i) => (
            <Fragment key={s.title}>
              <div className="group relative flex-1 rounded-3xl border border-border bg-card/60 p-7 backdrop-blur-sm transition-all hover:-translate-y-1 hover:glow-blue">
                <div className="relative mb-5 h-14 w-14">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-[0_8px_30px_-6px_oklch(0.58_0.24_290_/_0.7)]">
                    <s.icon className="h-7 w-7" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-foreground glow-purple">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>

              {i < steps.length - 1 && (
                <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground/40 sm:block" />
              )}
            </Fragment>
          ))}
        </div>
      </section>

      {/* Trust pillars */}
      <section id="about" className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-5 sm:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="flex items-start gap-4 rounded-3xl border border-border bg-card/40 p-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-cyan">
                <p.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-foreground">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <footer className="mx-auto max-w-6xl px-5 py-16 text-center">
        <p className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          OinkAI is more than an app.{" "}
          <span className="text-gradient">It's your savings partner.</span>
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-brand text-[10px] font-bold text-white">
            ◆
          </span>
          Powered by Arc
        </div>
      </footer>
    </div>
  );
}
