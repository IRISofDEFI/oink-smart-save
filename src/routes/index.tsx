import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { BuiltOn } from "@/components/landing/BuiltOn";
import { ChatToSave } from "@/components/landing/ChatToSave";
import { CoreFeatures } from "@/components/landing/CoreFeatures";
import { FeatureStrip } from "@/components/landing/FeatureStrip";
import { CTA, Footer } from "@/components/landing/Footer";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { Resources } from "@/components/landing/Resources";
import { Roadmap } from "@/components/landing/Roadmap";
import { Trust } from "@/components/landing/Trust";

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
      <Navbar onLaunchApp={handleLaunchApp} />

      <Hero onLaunchApp={handleLaunchApp} coinAnchorRef={coinAnchorRef} />

      <FeatureStrip coinAnchorRef={coinAnchorRef} />
      <CoreFeatures />
      <ChatToSave />

      <HowItWorks />
      <BuiltOn />
      <Trust />

      <Roadmap />
      <Resources />

      <CTA />
      <Footer onLaunchApp={handleLaunchApp} />
    </div>
  );
}
