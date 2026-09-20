import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import {
  Lock,
  ArrowRight,
  ChevronRight,
  Mail,
  Repeat,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
  ShieldCheck,
  Brain,
  PiggyBank,
  CircleCheck,
  Github,
  X as XIcon,
} from "lucide-react";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ChartAnalysisIcon } from "@/components/icons/ChartAnalysisIcon";
import { MessageCircleMoreIcon } from "@/components/icons/MessageCircleMoreIcon";
import { Wordmark } from "@/components/PigLogo";
import { PigOrb, CosmicBackground } from "@/components/PigOrb";
import { Button } from "@/components/ui/button";
import RadialOrbitalTimeline, { type TimelineItem } from "@/components/ui/radial-orbital-timeline";
import { Testimonials, type Testimonial } from "@/components/ui/testimonials-columns-1";

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
    icon: MessageCircleMoreIcon,
    title: "Chat to Save",
    desc: "Just tell OinkAI what you want to do. No menus, no jargon — only a friendly conversation.",
  },
  {
    icon: Lock,
    title: "Lock USDC",
    desc: "Set aside USDC for a chosen duration. It stays put until the day you chose, safe from impulse spending.",
  },
  {
    icon: ChartAnalysisIcon,
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

function NotionIcon({ className }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-[6px] border border-current text-[11px] font-bold leading-none ${className ?? ""}`}
    >
      N
    </span>
  );
}

const socialLinks = [
  { href: "https://x.com/arc?s=20", title: "Arc on X", icon: XIcon },
  { href: "https://x.com/oink_AI?s=20", title: "OinkAI on X", icon: XIcon },
  {
    href: "https://github.com/IRISofDEFI/oink-smart-save",
    title: "OinkAI on GitHub",
    icon: Github,
  },
  {
    href: "https://app.notion.com/p/OinkAI-38e56c2fe03e80699f29ef0d14e94248?source=copy_link",
    title: "OinkAI Whitepaper",
    icon: NotionIcon,
  },
];

const roadmap: TimelineItem[] = [
  {
    id: 1,
    title: "StableFX",
    date: "Liquidity",
    content:
      "Swap between stablecoins at near-parity rates before you lock, so you can save in the currency that suits you.",
    category: "Roadmap",
    icon: Repeat,
    relatedIds: [2],
    status: "pending",
    energy: 20,
  },
  {
    id: 2,
    title: "Track Your Savings",
    date: "Dashboard",
    content:
      "See your balance, every active lock and the days remaining — all in one calm, clear dashboard.",
    category: "Product",
    icon: TrendingUp,
    relatedIds: [1, 3],
    status: "completed",
    energy: 100,
  },
  {
    id: 3,
    title: "CCTP",
    date: "Transfers",
    content:
      "Circle's Cross-Chain Transfer Protocol, so USDC can move onto Arc from other chains without a bridge wrapper.",
    category: "Roadmap",
    icon: Sparkles,
    relatedIds: [2, 4],
    status: "pending",
    energy: 30,
  },
  {
    id: 4,
    title: "Email-Onboarding",
    date: "Onboarding",
    content:
      "Sign up with an email and a one-time code. Circle provisions the wallet — no seed phrase to write down.",
    category: "Product",
    icon: Mail,
    relatedIds: [3, 5],
    status: "completed",
    energy: 100,
  },
  {
    id: 5,
    title: "Save With AI",
    date: "Agent",
    content:
      "Tell OinkAI what to lock and for how long. It prepares the contract call; you confirm the transaction.",
    category: "Product",
    icon: Brain,
    relatedIds: [4],
    status: "in-progress",
    energy: 65,
  },
];

// ---------------------------------------------------------------------------
// PLACEHOLDER COPY — these are not real customer quotes. Written to show the
// layout only. Replace every entry with a real, attributable testimonial (and
// add `image` for a photo) before this page is treated as marketing material.
// ---------------------------------------------------------------------------
const testimonials: Testimonial[] = [
  {
    text: "I used to raid my savings every other week. Locking the USDC for 90 days took the decision out of my hands entirely.",
    name: "Placeholder One",
    role: "Beta tester",
  },
  {
    text: "Telling it what I wanted in plain English and watching it build the transaction was the moment it clicked for me.",
    name: "Placeholder Two",
    role: "Beta tester",
  },
  {
    text: "Signing up with an email and never touching a seed phrase is what finally got my sister to try it.",
    name: "Placeholder Three",
    role: "Beta tester",
  },
  {
    text: "The countdown on each lock is oddly motivating. I check it the way I used to check a step counter.",
    name: "Placeholder Four",
    role: "Beta tester",
  },
  {
    text: "Fees on Arc are low enough that locking small amounts weekly actually makes sense.",
    name: "Placeholder Five",
    role: "Beta tester",
  },
  {
    text: "It nudged me when I went to withdraw early. Mildly annoying, completely the point.",
    name: "Placeholder Six",
    role: "Beta tester",
  },
  {
    text: "Everything is non-custodial, so I can verify the lock on-chain myself. That is what sold me.",
    name: "Placeholder Seven",
    role: "Beta tester",
  },
  {
    text: "Six months in and I have not broken a single lock early. That has never happened before.",
    name: "Placeholder Eight",
    role: "Beta tester",
  },
  {
    text: "The dashboard shows every lock and how long is left in one glance. No spreadsheet needed.",
    name: "Placeholder Nine",
    role: "Beta tester",
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
    if (typeof document === "undefined") return;
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
                      className="rounded-full bg-gradient-brand-mid px-5 font-semibold text-white transition-shadow hover:glow-purple"
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
            className="rounded-full bg-gradient-brand-mid px-5 font-semibold text-white opacity-70"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        )}
      </header>

      {/* Hero */}
      <section
        id="home"
        /* `isolate` keeps the -z-10 decorative layers inside this section
           instead of letting them fall behind the opaque page background. */
        className="relative isolate mx-auto w-full max-w-4xl overflow-hidden rounded-b-xl px-5 pt-10 text-center sm:pt-16 md:px-8"
      >
        {/* Grid BG */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 h-[600px] w-full opacity-40
          bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]
          bg-[size:56px_56px]
          [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
        />

        {/* Radial accent — brand glow arc behind a dark ellipse */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex justify-center overflow-hidden">
          <div className="h-[24rem] w-[48rem] translate-y-1/2 rounded-[100%] bg-gradient-brand opacity-25 blur-[90px]" />
        </div>
        <div
          className="animate-fade-up pointer-events-none absolute left-1/2 top-[calc(100%-90px)] -z-10
          h-[500px] w-[700px] -translate-x-1/2 rounded-[100%]
          bg-[radial-gradient(closest-side,var(--background)_82%,transparent)]
          md:h-[500px] md:w-[1100px] lg:top-[calc(100%-150px)] lg:h-[750px] lg:w-[140%]"
        />

        <PigOrb priority className="mx-auto mb-8 h-44 w-44 animate-fade-in sm:h-56 sm:w-56" />

        {/* Eyebrow */}
        <div className="animate-fade-in mb-6">
          <span
            className="group mx-auto flex w-fit items-center justify-center rounded-3xl border border-border bg-card/40 px-5 py-2
            text-sm font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm"
          >
            Save in Dollars. Built on Arc
            <ChevronRight className="ml-2 inline h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>

        {/* Title */}
        <h1
          className="animate-fade-up mx-auto max-w-3xl text-balance
          bg-gradient-to-br from-foreground from-30% to-foreground/40 bg-clip-text
          text-5xl font-extrabold leading-[1.05] tracking-tight text-transparent
          delay-150 sm:text-6xl md:text-7xl"
        >
          Save smarter{" "}
          <span className="bg-gradient-to-br from-accent via-cyan to-primary bg-clip-text text-transparent">
            with AI.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed tracking-tight text-muted-foreground delay-300 md:text-xl">
          OinkAI helps you lock USDC on Arc so you can't spend what you shouldn't. Think of it as a
          digital piggy bank — only smarter.
        </p>

        {/* CTA */}
        <div className="animate-fade-up mt-10 flex flex-col items-center gap-3 delay-500">
          <Button
            size="lg"
            onClick={handleLaunchApp}
            className="z-20 h-14 w-fit rounded-full bg-gradient-brand-mid px-8 text-base font-semibold tracking-tight text-white transition-shadow hover:glow-purple md:w-52"
          >
            Launch App
            <ArrowRight className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Your money, locked by you — until you're ready.
          </span>
        </div>

        {/* Bottom Fade */}
        <div
          className="animate-fade-up relative mt-26 [perspective:2000px]
          after:absolute after:inset-0 after:z-50
          after:[background:linear-gradient(to_top,var(--background)_10%,transparent)]"
        />
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-border bg-card/60 p-7 backdrop-blur-sm transition-all hover:-translate-y-1 hover:glow-blue"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white glow-tile">
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
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24">
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white glow-tile">
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

      {/* Orbital roadmap */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <RadialOrbitalTimeline
          timelineData={roadmap}
          center={<PigOrb className="h-full w-full" />}
          className="h-[34rem] sm:h-[31rem] md:h-[37rem] lg:h-[44rem]"
        />
      </section>

      {/* Trust pillars */}
      <section id="about" className="mx-auto max-w-6xl px-5 py-24">
        {/* Marquee: the list is rendered twice and the track slides exactly one
            copy's width, so the loop is seamless. Pauses on hover. */}
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
          <div className="flex w-max animate-marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-5 pr-5" aria-hidden={copy === 1}>
                {pillars.map((p) => (
                  <div
                    key={p.title}
                    className="flex w-[21rem] shrink-0 items-start gap-4 rounded-3xl border border-border bg-card/40 p-6"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-accent">
                      <p.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-foreground">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-6xl px-5 py-24">
        <Testimonials
          testimonials={testimonials}
          title={
            <>
              What our <span className="text-gradient">savers</span> say
            </>
          }
          subtitle="Real talk from people building a savings habit on Arc."
        />
      </section>

      {/* Closing */}
      <footer className="mx-auto max-w-6xl px-5 py-26 text-center">
        <p className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          OinkAI is more than an app.{" "}
          <span className="text-gradient">It's your savings partner.</span>
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <img
            src="/arc-logo.png"
            alt="Arc"
            className="h-6 w-auto object-contain"
          />
          Powered by Arc
        </div>

        <div className="mx-auto mt-10 flex max-w-xs items-center justify-center gap-6 border-t border-border pt-8 sm:max-w-sm sm:gap-8">
          {socialLinks.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.title}
              aria-label={s.title}
              className="text-muted-foreground/80 transition-all hover:scale-105 hover:text-foreground"
            >
              <s.icon className="h-6 w-6" />
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
