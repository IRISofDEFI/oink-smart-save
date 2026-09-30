import { PigLogo } from "@/components/PigLogo";

/**
 * Hero visual cards. Both are illustrations (aria-hidden): the figures are
 * example values, not the visitor's data.
 */

/** Left card: charcoal savings-goal card with a soft sheen. */
export function SavingsCard() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[395/257] w-full overflow-hidden rounded-[20px] bg-charcoal p-6 text-white shadow-2xl shadow-ink/60 sm:w-[395px]"
    >
      {/* Sheen */}
      <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_55%,color-mix(in_oklab,var(--brand-white)_7%,transparent)_70%,transparent_85%)]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="rounded-md border border-white/15 px-2 py-0.5 text-[11px] uppercase tracking-wider text-white/60">
            Locked
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <PigLogo className="h-5 w-5" />
            OinkAI
          </span>
        </div>

        {/* TODO: COPY — example goal and figures */}
        <div>
          <p className="text-sm text-white/70">Emergency fund</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">1,250.00 USDC</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[62%] rounded-full bg-brand-light" />
          </div>
        </div>

        <div className="flex gap-8 text-[11px] uppercase tracking-wider text-white/50">
          <div>
            Goal
            <p className="mt-0.5 text-xs normal-case tracking-normal text-white">2,000 USDC</p>
          </div>
          <div>
            Unlocks
            <p className="mt-0.5 text-xs normal-case tracking-normal text-white">Mar 14, 2027</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Right card: white balance widget with a growth pill and sparkline. */
export function BalanceCard() {
  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden rounded-[20px] bg-white text-ink shadow-2xl shadow-ink/60 sm:w-[307px]"
    >
      <div className="flex items-center gap-3 bg-brand-light/25 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
          <PigLogo className="h-6 w-6" />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold">OinkAI</p>
          <p className="text-xs text-muted-grey">Savings account</p>
        </div>
      </div>

      {/* TODO: COPY — example balance and change */}
      <div className="flex items-end justify-between gap-3 px-4 pb-4 pt-3">
        <div>
          <p className="text-[11px] text-muted-grey">Balance</p>
          <p className="flex items-center gap-1.5 text-lg font-semibold tracking-tight">
            4,820.50 USDC
            <span className="rounded-full bg-brand-light/40 px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark">
              +2.09%
            </span>
          </p>
        </div>
        <Sparkline />
      </div>
    </div>
  );
}

function Sparkline() {
  const points = "0,30 10,27 20,29 30,22 40,24 50,16 60,18 70,10 80,6";
  return (
    <svg viewBox="0 0 80 34" className="h-9 w-20 shrink-0" aria-hidden="true">
      <polygon points={`${points} 80,34 0,34`} fill="var(--brand-green)" fillOpacity="0.25" />
      <polyline
        points={points}
        fill="none"
        stroke="var(--brand-green-deep)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
