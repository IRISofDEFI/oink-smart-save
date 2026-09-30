import { Quote } from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { Eyebrow } from "./CoreFeatures";
import { FadeUp, Reveal } from "./motion";

type Testimonial = { text: string; name: string; role: string };

// ---------------------------------------------------------------------------
// PLACEHOLDER COPY — these are not real customer quotes. Written to show the
// layout only. Replace every entry with a real, attributable testimonial
// before this page is treated as marketing material.
// ---------------------------------------------------------------------------
// TODO: COPY — real testimonials
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
];

// Revio's bento: column spans and orders per breakpoint. "highlight" slots
// replace Revio's video cards with a dark pull-quote tile.
const layout = [
  { span: "sm:col-span-6 lg:col-span-5", order: "sm:order-1 lg:order-1", highlight: false },
  { span: "sm:col-span-6 lg:col-span-3", order: "sm:order-2 lg:order-2", highlight: true },
  { span: "sm:col-span-6 lg:col-span-4", order: "sm:order-4 lg:order-3", highlight: false },
  { span: "sm:col-span-6 lg:col-span-3", order: "sm:order-3 lg:order-4", highlight: true },
  { span: "sm:col-span-6 lg:col-span-4", order: "sm:order-5 lg:order-5", highlight: false },
  { span: "sm:col-span-6 lg:col-span-5", order: "sm:order-6 lg:order-6", highlight: false },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TestimonialsGrid() {
  return (
    <section id="testimonials" className="landing-light pb-12 pt-12 md:pb-20 md:pt-20 xl:pb-32 xl:pt-32">
      <Container className="space-y-8 md:space-y-10 xl:space-y-[60px]">
        <div className="max-w-[683px]">
          <FadeUp className="mb-1.5 md:mb-4">
            <Eyebrow>Testimonials</Eyebrow>
          </FadeUp>
          <Reveal
            delay={0.1}
            lines={["What our savers say"]}
            className="mb-3 text-[32px] font-semibold leading-[1.2] tracking-tight md:text-[40px] lg:text-[44px]"
          />
          <FadeUp delay={0.2}>
            <p className="text-lg text-muted-foreground">Real talk from people building a savings habit on Arc.</p>
          </FadeUp>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {testimonials.map((t, i) => {
            const slot = layout[i];
            return (
              <figure
                key={t.name}
                className={cn(
                  "col-span-12 flex h-full flex-col justify-between gap-12 rounded-2xl p-6 md:gap-16",
                  slot.span,
                  slot.order,
                  slot.highlight ? "bg-ink text-white" : "bg-card text-card-foreground",
                )}
              >
                {slot.highlight && <Quote className="h-8 w-8 text-brand-light" aria-hidden="true" />}
                <blockquote className={cn("max-w-[313px]", slot.highlight && "text-lg font-semibold leading-snug")}>
                  {t.text}
                </blockquote>
                <figcaption className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      slot.highlight ? "bg-brand-light text-ink" : "bg-brand-dark text-white",
                    )}
                  >
                    {initials(t.name)}
                  </span>
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    <span className={cn("block text-sm", slot.highlight ? "text-white/60" : "text-muted-foreground")}>
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
