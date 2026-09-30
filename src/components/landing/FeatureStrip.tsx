import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { motion, useMotionValue, useScroll, useTransform } from "motion/react";

import { cn } from "@/lib/utils";
import { Coin } from "./Coin";
import { Container } from "./Container";
import { featureCards, type FeatureCard } from "./features-data";
import { EASE, FadeUp, Stagger, StaggerItem } from "./motion";

/**
 * Section C. A row of feature cards from features-data.ts with an empty slot
 * in the middle, where the scrolling coin (Section D) lands. The slot is
 * desktop-only; below lg the cards sit two per row.
 */
export function FeatureStrip({ coinAnchorRef }: { coinAnchorRef: RefObject<HTMLDivElement | null> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const slotIndex = Math.ceil(featureCards.length / 2);
  const gridStyle = {
    "--cols": featureCards.length + 1,
    "--cols-no-slot": featureCards.length,
  } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      id="features"
      className="landing-light scroll-mt-20 pb-12 pt-12 md:pb-20 md:pt-20 xl:pt-[100px]"
    >
      <Container className="space-y-8 md:space-y-10 xl:space-y-[60px]">
        <FadeUp>
          {/* TODO: COPY — strip heading */}
          <h2 className="mx-auto max-w-[420px] text-center text-[28px] font-semibold leading-[1.3] tracking-tight md:text-[32px] lg:text-[36px]">
            Your digital piggy bank,{" "}
            <span className="text-muted-foreground">only smarter.</span>
          </h2>
        </FadeUp>

        <Stagger
          style={gridStyle}
          className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))] motion-reduce:lg:grid-cols-[repeat(var(--cols-no-slot),minmax(0,1fr))]"
        >
          {featureCards.map((card, i) => (
            <Fragment key={card.id}>
              {i === slotIndex && (
                <CoinSlot>
                  <TravellingCoin sectionRef={sectionRef} anchorRef={coinAnchorRef} />
                </CoinSlot>
              )}
              <StaggerItem className="relative z-10">
                <FeatureCardView card={card} />
              </StaggerItem>
            </Fragment>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/** Desktop-only; with reduced motion there is no travel, so no slot either. */
function CoinSlot({ children }: { children?: ReactNode }) {
  return (
    <div className="hidden rounded-2xl bg-card lg:block motion-reduce:lg:hidden" aria-hidden="true">
      <div className="flex h-full items-center justify-center p-6">{children}</div>
    </div>
  );
}

function FeatureCardView({ card }: { card: FeatureCard }) {
  const Icon = card.icon;
  return (
    <div className="flex h-full min-h-[190px] flex-col justify-between gap-6 rounded-2xl bg-card p-5 md:p-6">
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          card.tint === "light" ? "bg-brand-light/45 text-brand-dark" : "bg-brand-dark text-white",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="mb-2 text-base font-semibold text-card-foreground md:text-lg">{card.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
      </div>
    </div>
  );
}

/**
 * Section D. Built the way the Revio reference does it: the coin's home is
 * the strip's centre slot, and scroll progress pulls it back (translate +
 * scale) to the hero anchor. As the strip scrolls up to the top of the
 * viewport the offset eases to zero, so the coin lands in the slot and then
 * scrolls away with the card.
 *
 * Differences from Revio: the start point and scale come from measuring the
 * real hero anchor (not a fixed "+250px" / 3x), positions are measured once
 * per layout change rather than on every scroll event, and the travel start is
 * clamped so tall viewports still begin with the coin in the hero.
 */
function TravellingCoin({
  sectionRef,
  anchorRef,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  anchorRef: RefObject<HTMLDivElement | null>;
}) {
  const homeRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Measured geometry, kept in motion values so transforms update without re-rendering.
  const startX = useMotionValue(0);
  const startY = useMotionValue(0);
  const startScale = useMotionValue(1);
  const rangeFrom = useMotionValue(0);
  const rangeTo = useMotionValue(1);

  const { scrollY } = useScroll();
  const progress = useTransform([scrollY, rangeFrom, rangeTo], ([y, from, to]: number[]) =>
    to <= from ? 1 : Math.min(1, Math.max(0, (y - from) / (to - from))),
  );
  const x = useTransform([progress, startX], ([p, sx]: number[]) => sx * (1 - p));
  const y = useTransform([progress, startY], ([p, sy]: number[]) => sy * (1 - p));
  const scale = useTransform([progress, startScale], ([p, s]: number[]) => s + (1 - s) * p);
  // A slow quarter-ish turn over the journey.
  const rotate = useTransform(progress, [0, 1], [-25, 0]);

  useEffect(() => {
    const measure = () => {
      const home = homeRef.current;
      const anchor = anchorRef.current;
      const section = sectionRef.current;
      // offsetParent is null while hidden (below lg, or reduced motion).
      if (!home || !anchor || !section || home.offsetParent === null || anchor.offsetParent === null) {
        setReady(false);
        return;
      }
      const h = home.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      startX.set(a.left + a.width / 2 - (h.left + h.width / 2));
      startY.set(a.top + a.height / 2 - (h.top + h.height / 2));
      startScale.set(a.width / h.width);

      // Revio's range: from the strip entering the viewport bottom to it reaching the top.
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      rangeFrom.set(Math.max(0, sectionTop - window.innerHeight));
      rangeTo.set(sectionTop);
      setReady(true);
    };

    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    void document.fonts?.ready.then(measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [anchorRef, sectionRef, startX, startY, startScale, rangeFrom, rangeTo]);

  return (
    <div ref={homeRef} className="h-28 w-28 xl:h-32 xl:w-32">
      <motion.div
        className="h-full w-full will-change-transform"
        style={{ x, y, scale, rotate }}
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <Coin />
      </motion.div>
    </div>
  );
}
