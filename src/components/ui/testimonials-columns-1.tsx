import React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export interface Testimonial {
  text: string;
  name: string;
  role: string;
  /** Optional avatar. Falls back to a brand-gradient monogram. */
  image?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 10,
}: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className={className}>
      {/* The list is rendered twice and the track travels exactly one copy's
          height, so the loop is seamless. Each copy carries its own trailing
          gap — otherwise half the track is not one copy and it jumps. */}
      <motion.div
        animate={reduceMotion ? undefined : { translateY: "-50%" }}
        transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        className="flex flex-col"
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex flex-col gap-6 pb-6" aria-hidden={copy === 1}>
            {testimonials.map((t, i) => (
              <figure
                key={i}
                className="w-full max-w-xs rounded-3xl border border-border bg-card/40 p-8 backdrop-blur-sm"
              >
                <blockquote className="text-sm leading-relaxed text-muted-foreground">
                  {t.text}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  {t.image ? (
                    <img
                      width={40}
                      height={40}
                      src={t.image}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand-mid text-xs font-bold text-white"
                    >
                      {initials(t.name)}
                    </span>
                  )}
                  <span className="flex flex-col">
                    <span className="font-semibold leading-5 tracking-tight text-foreground">
                      {t.name}
                    </span>
                    <span className="text-sm leading-5 tracking-tight text-muted-foreground">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export const Testimonials = ({
  testimonials,
  eyebrow = "Testimonials",
  title,
  subtitle,
  className,
}: {
  testimonials: Testimonial[];
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) => {
  const columns = [testimonials.slice(0, 3), testimonials.slice(3, 6), testimonials.slice(6, 9)];

  return (
    <div className={cn("relative", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="mx-auto flex max-w-[540px] flex-col items-center justify-center text-center"
      >
        {eyebrow && (
          <span className="rounded-full border border-border bg-card/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
      </motion.div>

      <div className="mt-10 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_25%,#000_75%,transparent)]">
        <TestimonialsColumn testimonials={columns[0]} duration={15} />
        <TestimonialsColumn testimonials={columns[1]} className="hidden md:block" duration={19} />
        <TestimonialsColumn testimonials={columns[2]} className="hidden lg:block" duration={17} />
      </div>
    </div>
  );
};
