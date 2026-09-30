import { Fragment, type CSSProperties, type ReactNode, type Ref } from "react";

import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { featureCards, type FeatureCard } from "./features-data";
import { FadeUp, Stagger, StaggerItem } from "./motion";

/**
 * Section C. A row of feature cards from features-data.ts with an empty slot
 * in the middle, where the scrolling coin (Section D) lands. The slot is
 * desktop-only; below lg the cards sit two per row.
 */
export function FeatureStrip({
  sectionRef,
  coin,
}: {
  sectionRef?: Ref<HTMLElement>;
  /** Rendered inside the middle slot (the travelling coin). */
  coin?: ReactNode;
}) {
  const slotIndex = Math.ceil(featureCards.length / 2);
  const gridStyle = { "--cols": featureCards.length + 1 } as CSSProperties;

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
          className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        >
          {featureCards.map((card, i) => (
            <Fragment key={card.id}>
              {i === slotIndex && <CoinSlot>{coin}</CoinSlot>}
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

function CoinSlot({ children }: { children?: ReactNode }) {
  return (
    <div className="hidden rounded-2xl bg-card lg:block" aria-hidden="true">
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
