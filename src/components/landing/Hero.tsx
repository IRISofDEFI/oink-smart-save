import type { Ref } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { Coin } from "./Coin";
import { Container } from "./Container";
import { BalanceCard, SavingsCard } from "./HeroCards";
import { LandingButton } from "./LandingButton";
import { Enter, Float } from "./motion";
import { scrollToSection } from "./Navbar";

// TODO: COPY — badge lines above the headline
const badges = ["Save in dollars. Built on Arc", "Non-custodial by design"];

/**
 * Section B. Entrance is CSS-driven (Enter) with Revio's delays so it plays
 * from the server-rendered HTML. `coinAnchorRef` marks where the travelling
 * coin (Section D) starts; below lg, and under reduced motion, a static coin
 * is shown here instead.
 */
export function Hero({
  onLaunchApp,
  coinAnchorRef,
}: {
  onLaunchApp: () => void;
  coinAnchorRef: Ref<HTMLDivElement>;
}) {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-ink pb-[60px] pt-[120px] md:pb-20 md:pt-[140px] lg:pb-24 lg:pt-[160px] xl:pt-[200px]"
    >
      <Container className="relative">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:mb-8">
          {badges.map((b, i) => (
            <Enter key={b} delay={i * 0.1}>
              <span className="inline-flex items-center gap-2 text-sm text-white/70">
                <BadgeCheck className="h-4 w-4 fill-brand-light stroke-ink" aria-hidden="true" />
                {b}
              </span>
            </Enter>
          ))}
        </div>

        <Enter delay={0.2} className="mx-auto mb-4 max-w-3xl text-center md:mb-6">
          <h1 className="text-[40px] font-semibold leading-[1.15] tracking-tight text-white md:text-[54px] lg:text-[68px]">
            Save smarter with AI.
          </h1>
        </Enter>

        <Enter delay={0.3} className="mx-auto mb-8 max-w-xl text-center lg:mb-10">
          <p className="text-base leading-relaxed text-white/60 md:text-lg">
            OinkAI helps you lock USDC on Arc so you can't spend what you shouldn't. Think of it
            as a digital piggy bank — only smarter.
          </p>
        </Enter>

        <div className="mx-auto flex max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <Enter delay={0.4}>
            <LandingButton variant="light" asChild className="w-full sm:w-auto">
              <Link to="/signup">
                Sign up with email
                <ArrowRight />
              </Link>
            </LandingButton>
          </Enter>
          <Enter delay={0.5}>
            <LandingButton variant="outline" onClick={onLaunchApp} className="w-full sm:w-auto">
              Launch app
            </LandingButton>
          </Enter>
          <Enter delay={0.6} className="hidden sm:block">
            <LandingButton variant="link" onClick={() => scrollToSection("features")}>
              Explore features
            </LandingButton>
          </Enter>
        </div>

        {/* Visual group */}
        <div className="relative mx-auto mt-12 max-w-[904px] md:h-[440px] xl:mt-24">
          <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
            <Enter delay={0.6} className="w-full sm:w-auto">
              <Float>
                <SavingsCard />
              </Float>
            </Enter>
            <Enter delay={0.7} className="w-full sm:w-auto md:mt-4">
              <Float slow>
                <BalanceCard />
              </Float>
            </Enter>
          </div>

          {/* Coin anchor (md+). The travelling coin's start point is measured
              from this box; the static coin inside it shows only when the
              coin isn't travelling (md–lg, or reduced motion). */}
          <div
            ref={coinAnchorRef}
            className="pointer-events-none absolute left-1/2 top-[54%] hidden h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 md:block lg:h-[360px] lg:w-[360px]"
          >
            <Enter delay={0.8} className="h-full w-full lg:hidden motion-reduce:lg:block">
              <Coin />
            </Enter>
          </div>

          {/* Mobile static coin, in flow below the cards. */}
          <Enter delay={0.8} className="mx-auto mt-10 h-40 w-40 md:hidden">
            <Coin />
          </Enter>
        </div>
      </Container>
    </section>
  );
}
