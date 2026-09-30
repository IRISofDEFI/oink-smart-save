import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowLeftRight, Repeat, Wallet } from "lucide-react";

import { Container } from "./Container";
import { FadeUp } from "./motion";

type Tile = {
  id: string;
  label: string;
  mark: ReactNode;
  /** Position in % of the sticky viewport box: mobile, then md+. */
  pos: { m: [number, number]; d: [number, number] };
  /** Scroll progress at which the tile is fully shown (Revio's thresholds). */
  at: number;
};

// Revio shuffles the reveal order at random; a fixed order keeps SSR and the
// client in agreement.
const tiles: Tile[] = [
  {
    id: "arc",
    label: "Arc",
    mark: <img src="/arc-logo.png" alt="" className="h-8 w-auto object-contain md:h-10" />,
    pos: { m: [20, 24], d: [15, 24] },
    at: 0.45,
  },
  {
    id: "usdc",
    label: "USDC",
    mark: <span className="text-2xl font-bold text-brand-dark md:text-3xl">$</span>,
    pos: { m: [80, 24], d: [85, 24] },
    at: 0.15,
  },
  {
    id: "circle-wallets",
    label: "Circle wallets",
    mark: <Wallet className="h-7 w-7 text-brand-dark md:h-8 md:w-8" />,
    pos: { m: [20, 70], d: [15, 75] },
    at: 0.75,
  },
  {
    id: "cctp",
    label: "CCTP · soon",
    mark: <Repeat className="h-7 w-7 text-brand-dark md:h-8 md:w-8" />,
    pos: { m: [50, 78], d: [50, 80] },
    at: 0.3,
  },
  {
    id: "stablefx",
    label: "StableFX · soon",
    mark: <ArrowLeftRight className="h-7 w-7 text-brand-dark md:h-8 md:w-8" />,
    pos: { m: [80, 70], d: [85, 75] },
    at: 0.6,
  },
];

/**
 * Revio's "Integrations" section: 300vh tall with a sticky full-screen
 * heading; each tile fades and scales in over a 0.15 slice of scroll
 * progress. Under reduced motion all tiles are simply shown (CSS override).
 */
export function BuiltOn() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  return (
    <section
      ref={sectionRef}
      id="built-on"
      className="landing-light relative h-[300vh] bg-card motion-reduce:h-auto"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center motion-reduce:static">
        <Container className="relative z-10">
          <FadeUp>
            {/* TODO: COPY — heading */}
            <h2 className="mx-auto max-w-[644px] text-center text-[32px] font-semibold leading-[1.2] tracking-tight md:text-[48px] lg:text-[60px]">
              Built on Arc,{" "}
              <span className="text-muted-foreground">powered by USDC</span>
            </h2>
          </FadeUp>
        </Container>

        <ul aria-label="Built with" className="pointer-events-none absolute inset-0">
          {tiles.map((t) => (
            <TileView key={t.id} tile={t} progress={scrollYProgress} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function TileView({ tile, progress }: { tile: Tile; progress: MotionValue<number> }) {
  // Function transforms (not range maps) so motion computes these on the main
  // thread; its accelerated scroll-timeline path left opacity stuck at 0.
  const t = useTransform(progress, (p) => Math.min(1, Math.max(0, (p - (tile.at - 0.15)) / 0.15)));
  const opacity = useTransform(t, (v) => v);
  const scale = useTransform(t, (v) => 0.8 + 0.2 * v);
  const posVars = {
    "--x-m": `${tile.pos.m[0]}%`,
    "--y-m": `${tile.pos.m[1]}%`,
    "--x-d": `${tile.pos.d[0]}%`,
    "--y-d": `${tile.pos.d[1]}%`,
  } as CSSProperties;

  return (
    <li
      style={posVars}
      className="absolute left-[var(--x-m)] top-[var(--y-m)] -translate-x-1/2 -translate-y-1/2 md:left-[var(--x-d)] md:top-[var(--y-d)]"
    >
      <motion.div
        style={{ opacity, scale }}
        className="flex flex-col items-center gap-2 motion-reduce:![transform:none] motion-reduce:!opacity-100"
      >
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white shadow-lg shadow-ink/5 sm:h-[70px] sm:w-[70px] md:h-[91px] md:w-[91px]">
          {tile.mark}
        </span>
        <span className="whitespace-nowrap text-xs text-muted-foreground md:text-sm">{tile.label}</span>
      </motion.div>
    </li>
  );
}
