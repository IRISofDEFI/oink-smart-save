import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck } from "lucide-react";

import { Container } from "./Container";
import { LandingButton } from "./LandingButton";
import { FadeUp, Reveal } from "./motion";

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
      </Container>
    </section>
  );
}
