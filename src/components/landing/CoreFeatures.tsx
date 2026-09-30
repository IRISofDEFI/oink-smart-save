import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck } from "lucide-react";

import { Container } from "./Container";
import { LandingButton } from "./LandingButton";
import { FadeUp, Reveal } from "./motion";
import { LockRing, LocksList } from "./CoreIllustrations";
import { ScheduleWidget } from "./ScheduleWidget";

/** Small eyebrow label with a check icon (brand-dark on white). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[15px] text-brand-dark">
      <CircleCheck className="h-4 w-4" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Sections E (header) → F (spotlight) → G (two cards). */
export function CoreFeatures() {
  return (
    <section
      id="core-features"
      className="landing-light pb-12 pt-12 md:pb-20 md:pt-20 xl:pb-32 xl:pt-32"
    >
      <Container className="space-y-8 md:space-y-10 xl:space-y-[60px]">
        {/* Section E */}
        <div className="flex flex-col items-start justify-between gap-4 md:gap-8 lg:flex-row lg:items-end">
          <div className="max-w-[860px] flex-1">
            <FadeUp className="mb-1.5 md:mb-4">
              {/* TODO: COPY — eyebrow */}
              <Eyebrow>Why OinkAI</Eyebrow>
            </FadeUp>
            <Reveal
              delay={0.1}
              lines={["Your money, locked by you —", "until you're ready."]}
              className="mb-3 text-[32px] font-semibold leading-[1.1] tracking-tight md:mb-6 md:text-[48px] lg:text-[60px]"
            />
            <FadeUp delay={0.3}>
              <p className="text-base text-foreground md:text-lg">
                Set aside USDC for a chosen duration. It stays put until the day you chose.
              </p>
            </FadeUp>
          </div>

          <FadeUp delay={0.4} className="w-full sm:w-auto">
            <LandingButton variant="dark" asChild className="w-full sm:w-auto">
              <Link to="/signup">
                Sign up with email
                <ArrowRight />
              </Link>
            </LandingButton>
          </FadeUp>
        </div>

        <div className="space-y-4">
          {/* Section F */}
          <Spotlight />

          {/* Section G */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
            <FadeUp y={40} delay={0.1} className="lg:col-span-7">
              <SmallCard
                title="Track Your Savings"
                description="See your balance, your locks, and how many days are left — all in one calm, clear place."
              >
                <LocksList />
              </SmallCard>
            </FadeUp>
            <FadeUp y={40} delay={0.2} className="lg:col-span-5">
              <SmallCard
                title="Lock USDC"
                description="Set aside USDC for a chosen duration. It stays put until the day you chose, safe from impulse spending."
              >
                <LockRing />
              </SmallCard>
            </FadeUp>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Section F. Large dark card: photo background darkened on the left, copy +
 * button on the left, the schedule widget floating bottom-right.
 */
function Spotlight() {
  return (
    <FadeUp
      y={40}
      scale
      delay={0.2}
      className="relative overflow-hidden rounded-[28px] bg-ink p-6 pt-[260px] md:p-12 md:pt-[340px] lg:min-h-[597px] lg:p-16"
    >
      {/* Below lg the photo is a band across the top of the card (content
          starts beneath it) so her face isn't covered by the copy; from lg it
          fills the card behind everything, as in the Revio reference. There it
          is slightly enlarged and anchored bottom-right so her face sits above
          the schedule widget instead of behind it. */}
      <img
        src="/spotlight-trader.webp"
        alt="A woman smiling at her phone while relaxing at home in the evening"
        width={2076}
        height={1161}
        loading="lazy"
        decoding="async"
        className="absolute inset-x-0 top-0 h-[300px] w-full object-cover object-[85%_30%] md:h-[380px] md:object-[80%_30%] lg:inset-auto lg:bottom-0 lg:right-0 lg:h-full lg:w-[max(112%,1345px)] lg:max-w-none lg:object-[77%_100%]"
      />
      {/* Readability: fades the photo band into the card below lg; darkens the
          left side (behind the copy) from lg. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-transparent via-ink/30 to-ink md:h-[380px] lg:inset-0 lg:h-full lg:bg-gradient-to-r lg:from-ink lg:via-ink/70 lg:to-transparent"
      />

      <div className="relative z-10 flex h-full max-w-[427px] flex-col items-start justify-between gap-8 lg:min-h-[469px]">
        <div>
          <FadeUp delay={0.3}>
            {/* TODO: COPY — spotlight heading and paragraph */}
            <h3 className="mb-3 text-[28px] font-semibold leading-[1.3] tracking-tight text-white md:text-[32px] lg:text-[36px]">
              Saving on autopilot.
            </h3>
          </FadeUp>
          <FadeUp delay={0.4}>
            <p className="leading-relaxed text-white/70">
              Pick a day, set an amount, and OinkAI tops up your goals on schedule — with every
              save tracked in one clear timeline.
            </p>
          </FadeUp>
        </div>
        <FadeUp delay={0.5}>
          <LandingButton variant="light" asChild>
            <Link to="/signup">
              Sign up with email
              <ArrowRight />
            </Link>
          </LandingButton>
        </FadeUp>
      </div>

      <FadeUp
        x={60}
        y={0}
        delay={0.6}
        className="relative z-10 mt-10 w-full max-w-[414px] lg:absolute lg:bottom-10 lg:right-10 lg:mt-0"
      >
        <ScheduleWidget />
      </FadeUp>
    </FadeUp>
  );
}

function SmallCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-card p-6">
      <div className="flex flex-1 items-center justify-center px-2 py-6 md:px-8 md:py-12">{children}</div>
      <div className="mt-6 max-w-[420px] p-2">
        <h3 className="mb-2 text-xl font-semibold tracking-tight md:text-2xl">{title}</h3>
        <p className="leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
