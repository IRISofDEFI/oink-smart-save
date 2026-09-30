import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Github,
  X as XIcon,
} from "lucide-react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { BuiltOn } from "@/components/landing/BuiltOn";
import { ChatToSave } from "@/components/landing/ChatToSave";
import { CoreFeatures } from "@/components/landing/CoreFeatures";
import { FeatureStrip } from "@/components/landing/FeatureStrip";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { Resources } from "@/components/landing/Resources";
import { Roadmap } from "@/components/landing/Roadmap";
import { TestimonialsGrid } from "@/components/landing/TestimonialsGrid";
import { Trust } from "@/components/landing/Trust";
import { CosmicBackground } from "@/components/PigOrb";
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
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <CosmicBackground />

      <Navbar onLaunchApp={handleLaunchApp} />

      <Hero onLaunchApp={handleLaunchApp} coinAnchorRef={coinAnchorRef} />

      <FeatureStrip coinAnchorRef={coinAnchorRef} />
      <CoreFeatures />
      <ChatToSave />

      <HowItWorks />
      <BuiltOn />
      <Trust />
      <TestimonialsGrid />

      <Roadmap />
      <Resources />

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
