import { ArrowUpRight } from "lucide-react";

import { Container } from "./Container";
import { Eyebrow } from "./CoreFeatures";
import { LandingButton } from "./LandingButton";
import { links } from "./links";
import { FadeUp, Reveal } from "./motion";

// TODO: COPY — card labels and blurbs
const resources = [
  {
    link: links.whitepaper,
    label: "Whitepaper",
    title: "Read the OinkAI whitepaper",
    blurb: "How locks, the AI agent and Arc fit together.",
  },
  {
    link: links.oinkX,
    label: "Updates",
    title: "Follow OinkAI on X",
    blurb: "Product updates and release notes as they ship.",
  },
  {
    link: links.github,
    label: "Open source",
    title: "Browse the code on GitHub",
    blurb: "Read the contracts and the app source yourself.",
  },
];

/** Revio's "Blog" section, pointing at OinkAI's real external resources. */
export function Resources() {
  return (
    <section id="resources" className="landing-light pb-12 pt-12 md:pb-20 md:pt-20 xl:pb-32 xl:pt-32">
      <Container className="space-y-8 md:space-y-10 xl:space-y-[60px]">
        <div className="flex flex-col items-start justify-between gap-4 md:gap-8 lg:flex-row lg:items-end">
          <div className="max-w-[567px]">
            <FadeUp className="mb-1.5 md:mb-4">
              <Eyebrow>Resources</Eyebrow>
            </FadeUp>
            {/* TODO: COPY — heading */}
            <Reveal
              delay={0.1}
              lines={["Dig deeper into OinkAI"]}
              className="text-[32px] font-semibold leading-[1.2] tracking-tight md:text-[48px] lg:text-[60px]"
            />
          </div>
          <FadeUp delay={0.2}>
            <LandingButton variant="dark" asChild>
              <a href={links.whitepaper.href} target="_blank" rel="noopener noreferrer">
                Whitepaper
                <ArrowUpRight />
              </a>
            </LandingButton>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((r, i) => {
            const Icon = r.link.icon;
            return (
              <FadeUp key={r.link.href} delay={i * 0.1}>
                <a
                  href={r.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-ink">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--brand-green)_30%,transparent),transparent_60%)] transition-transform duration-500 group-hover:scale-110"
                    />
                    <Icon className="relative h-14 w-14 text-brand-light" aria-hidden="true" />
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-full bg-card px-3 py-1 text-foreground">{r.label}</span>
                  </div>
                  <h3 className="mt-3 flex items-start justify-between gap-3 text-xl font-semibold tracking-tight">
                    {r.title}
                    <ArrowUpRight
                      className="mt-1 h-5 w-5 shrink-0 text-brand-dark transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="mt-2 text-muted-foreground">{r.blurb}</p>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </FadeUp>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
