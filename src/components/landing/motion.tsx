import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Shared landing-page motion. Every section uses these so timing stays in one
 * place. Values follow the Revio reference's AnimateOnView primitive.
 * Only transform and opacity are animated. Under prefers-reduced-motion,
 * movement is dropped and elements simply fade.
 */
export const EASE = [0.21, 0.47, 0.32, 0.98] as const;
export const DURATION = 0.8;
export const STAGGER = 0.1;
export const VIEWPORT = { once: true, margin: "-50px" } as const;

type FadeUpProps = HTMLMotionProps<"div"> & {
  delay?: number;
  /** Starting offset in px. Revio uses 20 for text, 40 for cards. */
  y?: number;
  /** Also scale from 0.96. */
  scale?: boolean;
};

/** Fades and rises into place once, when scrolled into view. */
export function FadeUp({ delay = 0, y = 20, scale = false, children, ...props }: FadeUpProps) {
  const reduce = useReducedMotion();
  const initial = reduce ? { opacity: 0 } : { opacity: 0, y, scale: scale ? 0.96 : 1 };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = HTMLMotionProps<"div"> & {
  /** Gap between children, in seconds. */
  stagger?: number;
  delay?: number;
};

/** Parent for StaggerItem children; they enter one after another. */
export function Stagger({ stagger = STAGGER, delay = 0, children, ...props }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  y = 40,
  children,
  ...props
}: HTMLMotionProps<"div"> & { y?: number }) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
  };

  return (
    <motion.div variants={variants} {...props}>
      {children}
    </motion.div>
  );
}

/**
 * Heading that reveals line by line: each line slides up from behind a mask.
 * Pass one string per line; the element stays a single heading for screen
 * readers.
 */
export function Reveal({
  lines,
  as: Tag = "h2",
  className,
  delay = 0,
}: {
  lines: string[];
  as?: "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <Tag className={className} aria-label={lines.join(" ")}>
      {lines.map((line, i) => (
        // Padding + negative margin keeps descenders from being clipped by the mask.
        <span key={i} aria-hidden="true" className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className="block"
            initial={reduce ? { opacity: 0 } : { y: "110%" }}
            whileInView={reduce ? { opacity: 1 } : { y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: DURATION, delay: delay + i * 0.12, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * On-load entrance for above-the-fold content. Pure CSS (see `animate-enter`
 * in styles.css) so it runs from the server-rendered HTML with no flash while
 * the JS bundle hydrates.
 */
export function Enter({
  delay = 0,
  className,
  style,
  children,
}: {
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={cn("animate-enter", className)} style={{ animationDelay: `${delay}s`, ...style }}>
      {children}
    </div>
  );
}

/** Gentle idle bob (CSS). Off below md and under reduced motion, as in Revio. */
export function Float({
  slow = false,
  className,
  children,
}: {
  slow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(slow ? "md:animate-float-card-slow" : "md:animate-float-card", className)}>
      {children}
    </div>
  );
}
