import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";

// TODO: COPY — example schedule shown in the spotlight card
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const selectedDay = "Fri";
const items = [
  { title: "Weekly save — 50 USDC", when: "Sep 25, 2026 | 9:00 AM", done: true },
  { title: "Top up: Emergency fund", when: "Oct 2, 2026 | 9:00 AM", done: false },
];

/**
 * Floating white widget for Section F: OinkAI's auto-save schedule.
 * An illustration with example data, so hidden from assistive tech.
 */
export function ScheduleWidget() {
  return (
    <div
      aria-hidden="true"
      className="w-full rounded-[20px] bg-white p-5 text-ink shadow-2xl shadow-ink/40 md:p-7"
    >
      <p className="text-xl font-semibold tracking-tight">Savings schedule</p>
      <p className="mt-1 text-sm text-muted-grey">Weekly saves and goal top-ups.</p>

      <div className="mt-5 grid grid-cols-7 gap-1">
        {days.map((d) => (
          <span
            key={d}
            className={cn(
              "rounded-lg py-1.5 text-center text-xs sm:text-sm",
              d === selectedDay ? "bg-brand-light font-semibold text-ink" : "bg-surface text-ink/80",
            )}
          >
            {d}
          </span>
        ))}
      </div>

      <Stagger delay={0.9} stagger={0.25} className="relative mt-6">
        {/* Connector line between the two markers */}
        <span className="absolute left-[11px] top-6 h-[calc(100%-4.25rem)] w-px bg-brand-dark/40" />
        {items.map((item) => (
          <StaggerItem key={item.title} y={12} className="relative flex items-start gap-4 pb-6 last:pb-0">
            <span
              className={cn(
                "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                item.done ? "bg-brand-dark text-white" : "border-2 border-brand-dark/50 bg-white",
              )}
            >
              {item.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-grey">{item.when}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
