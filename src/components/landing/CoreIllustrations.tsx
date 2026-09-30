import { LoopWhenVisible } from "./motion";

/**
 * CSS/SVG illustrations for the Section G cards. Example data only, so both
 * are hidden from assistive tech.
 */

// TODO: COPY — example locks
const locks = [
  { name: "Emergency fund", amount: "1,250 USDC", progress: 62, left: "168 days left" },
  { name: "New laptop", amount: "600 USDC", progress: 85, left: "21 days left" },
  { name: "Holiday", amount: "400 USDC", progress: 30, left: "240 days left" },
];

/** Mini dashboard: active locks with progress and days remaining. */
export function LocksList() {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[340px] space-y-3 rounded-[18px] bg-white p-4 shadow-lg shadow-ink/5"
    >
      <div className="flex items-baseline justify-between px-1">
        <span className="text-sm font-semibold text-ink">Active locks</span>
        <span className="text-xs text-muted-grey">2,250 USDC</span>
      </div>
      {locks.map((l) => (
        <div key={l.name} className="rounded-xl bg-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{l.name}</span>
            <span className="text-xs text-ink/80">{l.amount}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-brand-dark"
              style={{ width: `${l.progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-grey">{l.left}</p>
        </div>
      ))}
    </div>
  );
}

/** Countdown ring with a slowly turning outer dial (stands in for Revio's Lottie loop). */
export function LockRing() {
  const r = 70;
  const c = 2 * Math.PI * r;
  const progress = 0.62;

  return (
    <div aria-hidden="true" className="relative h-[220px] w-[220px]">
      {/* Outer dial: transform-only loop, paused off-screen and for reduced motion. */}
      <LoopWhenVisible className="absolute inset-0 animate-[spin_24s_linear_infinite] motion-reduce:animate-none">
        <svg viewBox="0 0 220 220" className="h-full w-full">
          <circle
            cx="110"
            cy="110"
            r="104"
            fill="none"
            stroke="var(--brand-green-deep)"
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
        </svg>
      </LoopWhenVisible>
      <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke="var(--brand-black)"
          strokeOpacity="0.08"
          strokeWidth="14"
        />
        <circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke="var(--brand-green-mid)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-ink">
        {/* TODO: COPY — example countdown */}
        <span className="text-3xl font-semibold tracking-tight">168</span>
        <span className="text-xs text-muted-grey">days until unlock</span>
      </div>
    </div>
  );
}
