import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check } from "lucide-react";

import { PigLogo } from "@/components/PigLogo";
import { Container } from "./Container";
import { LandingButton } from "./LandingButton";
import { FadeUp, Stagger, StaggerItem } from "./motion";

const points = [
  {
    title: "Lock USDC by chatting",
    description:
      "Just tell OinkAI how much to lock and for how long. It handles the smart contract call. You confirm the transaction.",
  },
  {
    title: "AI That Understands You",
    description: "Personalized. Private. Powerful.",
  },
];

/**
 * Stands in for Revio's "Mobile app" section (dark): copy + checklist on the
 * left, a chat mockup sitting flush on the section's bottom edge on the right.
 */
export function ChatToSave() {
  return (
    <section id="chat-to-save" className="overflow-hidden bg-ink pt-12 text-white md:pt-20 xl:pt-32">
      <Container className="flex flex-col justify-between gap-8 md:flex-row md:gap-10 xl:gap-[60px]">
        <div className="flex flex-col pb-12 md:pb-20 lg:max-w-[560px] xl:pb-32">
          <FadeUp className="mb-1.5 md:mb-4">
            <span className="inline-flex items-center gap-2 text-[15px] text-white/70">
              <BadgeCheck className="h-4 w-4 fill-brand-light stroke-ink" aria-hidden="true" />
              Chat to Save
            </span>
          </FadeUp>
          <FadeUp delay={0.2} className="mb-3 md:mb-6">
            <h2 className="text-balance text-[32px] font-semibold leading-[1.2] tracking-tight md:text-[44px] lg:text-[52px]">
              Just tell OinkAI what you want to do.
            </h2>
          </FadeUp>
          <FadeUp delay={0.4} className="mb-6">
            <p className="text-lg text-white/70">No menus, no jargon — only a friendly conversation.</p>
          </FadeUp>

          <Stagger delay={0.5} className="mb-8 flex max-w-[459px] flex-col gap-4 md:mb-10 md:gap-6">
            {points.map((p) => (
              <StaggerItem key={p.title} y={20} className="flex gap-3 md:gap-4">
                <Check className="mt-1 h-6 w-6 shrink-0 text-brand-light" aria-hidden="true" />
                <div>
                  <h3 className="mb-1 text-lg">{p.title}</h3>
                  <p className="text-white/60">{p.description}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeUp delay={0.6}>
            <LandingButton variant="light" asChild>
              <Link to="/signup">
                Sign up with email
                <ArrowRight />
              </Link>
            </LandingButton>
          </FadeUp>
        </div>

        <FadeUp delay={0.4} y={40} className="flex items-end justify-center lg:justify-end">
          <ChatMockup />
        </FadeUp>
      </Container>
    </section>
  );
}

// TODO: COPY — example conversation
const messages = [
  { from: "user", text: "Lock 200 USDC for 3 months." },
  {
    from: "ai",
    text: "Got it. I've prepared a lock for 200 USDC until Jan 2, 2027. Confirm it in your wallet when you're ready.",
  },
] as const;

/** Phone-style chat panel, flush with the section's bottom edge. */
function ChatMockup() {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[400px] rounded-t-[40px] border-x-[10px] border-t-[10px] border-charcoal bg-ink/60 px-4 pb-8 pt-5 md:w-[400px]"
    >
      <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
        <PigLogo className="h-7 w-7" />
        <div className="leading-tight">
          <p className="text-sm font-semibold">OinkAI</p>
          <p className="text-[11px] text-white/50">Savings agent</p>
        </div>
      </div>

      <Stagger delay={0.8} stagger={0.35} className="flex flex-col gap-3">
        {messages.map((m) => (
          <StaggerItem
            key={m.text}
            y={12}
            className={
              m.from === "user"
                ? "ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-brand-light px-4 py-2.5 text-sm text-ink"
                : "max-w-[85%] rounded-2xl rounded-bl-md bg-charcoal px-4 py-2.5 text-sm text-white/90"
            }
          >
            {m.text}
          </StaggerItem>
        ))}
        <StaggerItem y={12} className="max-w-[85%] rounded-2xl border border-white/10 bg-charcoal/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/50">Lock summary</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-semibold">200 USDC</span>
            <span className="text-xs text-white/60">90 days</span>
          </div>
          <span className="mt-3 block rounded-lg bg-brand-light py-2 text-center text-sm font-semibold text-ink">
            Confirm lock
          </span>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
