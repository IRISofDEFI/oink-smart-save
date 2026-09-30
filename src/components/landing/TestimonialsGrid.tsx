import { ArrowUpRight, MessageSquarePlus, Quote } from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { Eyebrow } from "./CoreFeatures";
import { FadeUp, Reveal } from "./motion";
import {
  shareFeedbackUrl,
  testimonials,
  type InvitationCard,
  type RealTestimonial,
} from "./testimonials-data";

// Revio's bento: column spans and orders per breakpoint. "highlight" slots
// are the dark tiles (Revio's video cards).
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
          {/* TODO: COPY — section heading (reword once real testimonials are in) */}
          <Reveal
            delay={0.1}
            lines={["Your story could be next"]}
            className="text-[32px] font-semibold leading-[1.2] tracking-tight md:text-[40px] lg:text-[44px]"
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          {testimonials.slice(0, layout.length).map((entry, i) => {
            const slot = layout[i];
            const className = cn(
              "col-span-12 flex h-full flex-col justify-between gap-12 rounded-2xl p-6 md:gap-16",
              slot.span,
              slot.order,
              slot.highlight ? "bg-ink text-white" : "bg-card text-card-foreground",
            );
            return entry.kind === "real" ? (
              <RealCard key={entry.id} t={entry} dark={slot.highlight} className={className} />
            ) : (
              <InviteCard key={entry.id} invite={entry} dark={slot.highlight} className={className} />
            );
          })}
        </div>
      </Container>
    </section>
  );
}

type CardProps = { dark: boolean; className: string };

/** Open slot: clearly an invitation, never a review. */
function InviteCard({ dark, className }: CardProps & { invite: InvitationCard }) {
  return (
    <div className={className}>
      <MessageSquarePlus className={cn("h-8 w-8", dark ? "text-brand-light" : "text-brand-dark")} aria-hidden="true" />
      <div className="max-w-[313px]">
        {/* TODO: COPY — invitation card text */}
        <h3 className="text-lg font-semibold leading-snug">This spot is waiting for your story</h3>
        <p className={cn("mt-2", dark ? "text-white/60" : "text-muted-foreground")}>
          Tried OinkAI? Tell us how it went.
        </p>
      </div>
      <a
        href={shareFeedbackUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex h-10 w-fit items-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          dark
            ? "bg-brand-light text-ink hover:bg-brand-light/85 focus-visible:ring-offset-ink"
            : "bg-brand-dark text-white hover:bg-brand-dark/90",
        )}
      >
        Share your feedback
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only"> on X (opens in a new tab)</span>
      </a>
    </div>
  );
}

/** A real, attributable testimonial from testimonials-data.ts. */
function RealCard({ t, dark, className }: CardProps & { t: RealTestimonial }) {
  return (
    <figure className={className}>
      {dark && <Quote className="h-8 w-8 text-brand-light" aria-hidden="true" />}
      <div className="space-y-4">
        {t.screenshot && (
          <img
            src={t.screenshot.src}
            alt={`Post by ${t.name} (${t.handle})`}
            width={t.screenshot.width}
            height={t.screenshot.height}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-xl"
          />
        )}
        {t.quote && (
          <blockquote className={cn("max-w-[313px]", dark && "text-lg font-semibold leading-snug")}>{t.quote}</blockquote>
        )}
      </div>
      <figcaption className="flex items-center gap-4">
        {t.avatar ? (
          <img
            src={t.avatar}
            alt=""
            width={46}
            height={46}
            loading="lazy"
            className="h-[46px] w-[46px] shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              dark ? "bg-brand-light text-ink" : "bg-brand-dark text-white",
            )}
          >
            {initials(t.name)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-semibold">{t.name}</span>
          <a
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("block text-sm hover:underline", dark ? "text-white/60" : "text-muted-foreground")}
          >
            {t.handle}
            <span className="sr-only"> — view the original post (opens in a new tab)</span>
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
