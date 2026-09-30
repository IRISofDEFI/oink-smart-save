import { BadgeCheck, Brain, Mail, Repeat, Sparkles, TrendingUp } from "lucide-react";

import { PigOrb } from "@/components/PigOrb";
import RadialOrbitalTimeline, { type TimelineItem } from "@/components/ui/radial-orbital-timeline";
import { Container } from "./Container";
import { FadeUp, Reveal } from "./motion";

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

/**
 * OinkAI's orbital roadmap (no Revio equivalent), given a Revio-style dark
 * section header. The timeline component itself is unchanged.
 */
export function Roadmap() {
  return (
    <section id="roadmap" className="scroll-mt-20 bg-ink pb-12 pt-12 text-white md:pb-20 md:pt-20 xl:pt-32">
      <Container>
        <div className="mx-auto max-w-[683px] text-center">
          <FadeUp className="mb-1.5 md:mb-4">
            <span className="inline-flex items-center gap-2 text-[15px] text-white/70">
              <BadgeCheck className="h-4 w-4 fill-brand-light stroke-ink" aria-hidden="true" />
              Roadmap
            </span>
          </FadeUp>
          {/* TODO: COPY — roadmap heading and intro */}
          <Reveal
            delay={0.1}
            lines={["What we're building"]}
            className="mb-3 text-[32px] font-semibold leading-[1.2] tracking-tight md:text-[40px] lg:text-[44px]"
          />
          <FadeUp delay={0.2}>
            <p className="text-lg text-white/60">Tap a node to see what's live and what's next.</p>
          </FadeUp>
        </div>

        <FadeUp delay={0.2} y={40} className="mt-4">
          <RadialOrbitalTimeline
            timelineData={roadmap}
            center={<PigOrb className="h-full w-full" />}
            className="h-[34rem] sm:h-[31rem] md:h-[37rem] lg:h-[44rem]"
          />
        </FadeUp>
      </Container>
    </section>
  );
}
