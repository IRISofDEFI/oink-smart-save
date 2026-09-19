import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/PigLogo";
import { CosmicBackground } from "@/components/PigOrb";
import { cn } from "@/lib/utils";

const STEPS = ["Email", "Verify", "Wallet", "Done"] as const;

export function OnboardingShell({
  step,
  children,
}: {
  step: 1 | 2 | 3 | 4;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <CosmicBackground />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-12">
        <Link to="/" className="mb-8">
          <Wordmark />
        </Link>

        <StepIndicator step={step} />

        <div className="mt-6 w-full rounded-3xl border border-border bg-card/60 p-7 backdrop-blur-sm glow-blue">
          {children}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex w-full max-w-xs items-center justify-center gap-2">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const done = stepNumber < step;
        const active = stepNumber === step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-2.5 w-2.5 shrink-0 rounded-full transition-all",
                  done || active ? "bg-gradient-brand" : "bg-secondary",
                  active && "glow-blue scale-125",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  active ? "text-foreground" : "text-muted-foreground/70",
                )}
              >
                {label}
              </span>
            </div>
            {stepNumber < STEPS.length && (
              <span
                className={cn(
                  "mb-4 h-px flex-1",
                  done ? "bg-gradient-brand" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
