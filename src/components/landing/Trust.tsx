import { Link } from "@tanstack/react-router";
import { ArrowRight, Brain, ShieldCheck, Zap } from "lucide-react";

import { Container } from "./Container";
import { Eyebrow } from "./CoreFeatures";
import { LandingButton } from "./LandingButton";
import { FadeUp, Reveal } from "./motion";

const pillars = [
  { icon: Zap, title: "On Arc Chain", description: "Fast. Secure. Low fees." },
  { icon: ShieldCheck, title: "Your Data, Your Control", description: "Non-custodial by design." },
  { icon: Brain, title: "AI That Understands You", description: "Personalized. Private. Powerful." },
];

/** Revio's "Security & compliance" section, holding OinkAI's trust pillars. */
export function Trust() {
  return (
    <section id="about" className="landing-light scroll-mt-20 pb-12 pt-12 md:pb-20 md:pt-20 xl:pb-32 xl:pt-32">
      <Container className="space-y-8 md:space-y-10 xl:space-y-[60px]">
        <div className="flex flex-col items-start justify-between gap-4 md:gap-8 lg:flex-row lg:items-end">
          <div className="max-w-[683px] flex-1">
            <FadeUp className="mb-1.5 md:mb-4">
              {/* TODO: COPY — eyebrow and heading */}
              <Eyebrow>Built for trust</Eyebrow>
            </FadeUp>
            <Reveal
              delay={0.1}
              lines={["Safe by design."]}
              className="text-[32px] font-semibold leading-[1.1] tracking-tight md:text-[48px] lg:text-[60px]"
            />
          </div>
          <FadeUp delay={0.3} className="w-full sm:w-auto">
            <LandingButton variant="dark" asChild className="w-full sm:w-auto">
              <Link to="/signup">
                Sign up with email
                <ArrowRight />
              </Link>
            </LandingButton>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {pillars.map((p, i) => (
            <FadeUp key={p.title} delay={i * 0.1}>
              <div className="flex h-full flex-col justify-between gap-16 rounded-2xl bg-card p-[30px] transition-[transform,background-color] duration-300 hover:scale-[0.97] hover:bg-brand-light/25 md:gap-[100px]">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="max-w-[235px] text-xl font-semibold tracking-tight md:text-2xl">{p.title}</h3>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
                    <p.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="text-card-foreground">{p.description}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3}>
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-brand-light/35 p-[27px] md:flex-row">
            <p className="max-w-[400px] text-center text-lg md:max-w-full md:text-left">
              OinkAI is more than an app. It's your savings partner.
            </p>
            <LandingButton variant="dark" asChild>
              <Link to="/signup">
                Sign up with email
                <ArrowRight />
              </Link>
            </LandingButton>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
