import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
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
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { CoreFeatures } from "@/components/landing/CoreFeatures";
import { FeatureStrip } from "@/components/landing/FeatureStrip";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
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

function Landing() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [pendingNav, setPendingNav] = useState(false);
  const coinAnchorRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <CosmicBackground />

      <Navbar onLaunchApp={handleLaunchApp} />

      <Hero onLaunchApp={handleLaunchApp} coinAnchorRef={coinAnchorRef} />

      <FeatureStrip coinAnchorRef={coinAnchorRef} />
      <CoreFeatures />

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
