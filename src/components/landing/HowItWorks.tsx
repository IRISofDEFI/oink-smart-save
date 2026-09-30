import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, CircleCheck, Mail, PiggyBank, Wallet, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { Eyebrow } from "./CoreFeatures";
import { LandingButton } from "./LandingButton";
import { DURATION, EASE, FadeUp, Stagger, StaggerItem } from "./motion";

type Step = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  illustration: () => ReactNode;
};

const steps: Step[] = [
  {
    id: "connect",
    icon: Wallet,
    title: "Connect your wallet",
    description: "One click to connect any EVM wallet. Your keys stay yours — we never touch your funds.",
    illustration: ConnectIllustration,
  },
  {
    id: "lock",
    icon: PiggyBank,
    title: "Lock USDC by chatting",
    description:
      "Just tell OinkAI how much to lock and for how long. It handles the smart contract call. You confirm the transaction. Done.",
    illustration: LockIllustration,
  },
  {
    id: "track",
    icon: CircleCheck,
    title: "Track and withdraw",
    description:
      "See every lock, every countdown, every completed savings goal. Withdraw any time — but the app will nudge you to stay disciplined.",
    illustration: WithdrawIllustration,
  },
];

/**
 * Revio's tabbed "Business account" section, holding OinkAI's three steps.
 * Switching tabs re-mounts the copy so it staggers in again, and cross-fades
 * the illustration panel.
 */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const step = steps[active];
  const Illustration = step.illustration;

  const onKeyDown = (e: KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (active + delta + steps.length) % steps.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="how-it-works" className="landing-light scroll-mt-20 pb-12 pt-12 md:pb-20 md:pt-20 xl:pb-32 xl:pt-32">
      <Container className="space-y-10 xl:space-y-[60px]">
        <FadeUp>
          <div
            role="tablist"
            aria-label="How OinkAI works"
            onKeyDown={onKeyDown}
            className="grid w-full grid-cols-1 gap-2 rounded-2xl bg-surface p-1 md:grid-cols-3"
          >
            {steps.map((s, i) => {
              const selected = i === active;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`hiw-tab-${s.id}`}
                  aria-selected={selected}
                  aria-controls="hiw-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-4 rounded-xl p-2.5 text-left transition-all duration-300",
                    selected ? "bg-white text-ink shadow-sm" : "text-muted-foreground hover:bg-white/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      selected ? "bg-brand-dark text-white" : "bg-brand-light/45 text-brand-dark",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-semibold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </FadeUp>

        <div
          id="hiw-panel"
          role="tabpanel"
          aria-labelledby={`hiw-tab-${step.id}`}
          className="flex flex-col justify-between gap-12 md:flex-row md:items-center lg:gap-16"
        >
          <Stagger key={step.id} stagger={0.2} className="flex flex-col md:max-w-[366px]">
            <StaggerItem y={20} className="mb-1.5 md:mb-4">
              <Eyebrow>How it works · Step {active + 1}</Eyebrow>
            </StaggerItem>
            <StaggerItem y={20}>
              <h2 className="mb-3 text-[28px] font-semibold leading-[1.3] tracking-tight md:mb-5 md:text-[32px] lg:text-[36px]">
                {step.title}
              </h2>
            </StaggerItem>
            <StaggerItem y={20}>
              <p className="mb-4 text-lg md:mb-10">{step.description}</p>
            </StaggerItem>
            <StaggerItem y={20}>
              <LandingButton variant="dark" asChild>
                <Link to="/signup">
                  Sign up with email
                  <ArrowRight />
                </Link>
              </LandingButton>
            </StaggerItem>
          </Stagger>

          <div className="relative flex w-full max-w-[691px] items-center justify-center rounded-[32px] bg-card p-6 md:min-h-[524px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: DURATION / 2, ease: EASE }}
                className="flex w-full justify-center"
              >
                <Illustration />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── Illustrations (example UI, hidden from assistive tech) ─────────────── */

function Panel({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="w-full max-w-[340px] rounded-[20px] bg-white p-5 text-ink shadow-lg shadow-ink/5">
      {children}
    </div>
  );
}

function ConnectIllustration() {
  const options = [
    { icon: Mail, label: "Sign up with email", hint: "Circle wallet, no seed phrase" },
    { icon: Wallet, label: "Connect a wallet", hint: "Any EVM wallet" },
  ];
  return (
    <Panel>
      <p className="text-lg font-semibold tracking-tight">Get started</p>
      <p className="mb-4 text-sm text-muted-grey">Choose how to connect.</p>
      <div className="space-y-2">
        {options.map((o, i) => (
          <div
            key={o.label}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3",
              i === 0 ? "border-brand-dark bg-brand-light/20" : "border-ink/10",
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark text-white">
              <o.icon className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{o.label}</p>
              <p className="text-xs text-muted-grey">{o.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LockIllustration() {
  return (
    <Panel>
      {/* TODO: COPY — example lock */}
      <p className="text-lg font-semibold tracking-tight">New lock</p>
      <div className="mt-4 rounded-xl bg-surface p-3">
        <p className="text-xs text-muted-grey">Amount</p>
        <p className="text-2xl font-semibold tracking-tight">200 USDC</p>
      </div>
      <p className="mb-2 mt-4 text-xs text-muted-grey">Duration</p>
      <div className="grid grid-cols-4 gap-1.5">
        {["30d", "90d", "180d", "1y"].map((d) => (
          <span
            key={d}
            className={cn(
              "rounded-lg py-1.5 text-center text-sm",
              d === "90d" ? "bg-brand-light font-semibold text-ink" : "bg-surface text-ink/80",
            )}
          >
            {d}
          </span>
        ))}
      </div>
      <span className="mt-5 block rounded-lg bg-brand-dark py-2.5 text-center text-sm font-semibold text-white">
        Confirm in wallet
      </span>
    </Panel>
  );
}

function WithdrawIllustration() {
  return (
    <Panel>
      {/* TODO: COPY — example completed lock */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark text-white">
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
        <div className="leading-tight">
          <p className="font-semibold">Holiday</p>
          <p className="text-xs text-muted-grey">Goal reached · unlocked today</p>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between rounded-xl bg-surface p-3">
        <span className="text-xs text-muted-grey">Available</span>
        <span className="text-xl font-semibold tracking-tight">400 USDC</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full w-full rounded-full bg-brand-dark" />
      </div>
      <span className="mt-5 block rounded-lg bg-brand-dark py-2.5 text-center text-sm font-semibold text-white">
        Withdraw
      </span>
    </Panel>
  );
}
