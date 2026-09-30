import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Placeholder coin: flat SVG in the brand greens with a "$" mark and a soft
 * sheen. Scales to its container.
 */
// TODO: ASSET — replace with OinkAI's own 3D coin render (transparent PNG/WebP).
export function Coin({ className }: { className?: string }) {
  const id = useId();
  const face = `${id}-face`;
  const rim = `${id}-rim`;
  const sheen = `${id}-sheen`;

  return (
    <svg viewBox="0 0 200 200" className={cn("block h-full w-full", className)} aria-hidden="true">
      <defs>
        <radialGradient id={face} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="var(--brand-green)" />
          <stop offset="70%" stopColor="var(--brand-green-mid)" />
          <stop offset="100%" stopColor="var(--brand-green-deep)" />
        </radialGradient>
        <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-green)" />
          <stop offset="100%" stopColor="var(--brand-green-deep)" />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-white)" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--brand-white)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Edge thickness */}
      <circle cx="108" cy="106" r="88" fill="var(--brand-green-deep)" />
      <circle cx="104" cy="103" r="88" fill={`url(#${rim})`} />
      {/* Face */}
      <circle cx="100" cy="100" r="88" fill={`url(#${face})`} />
      <circle
        cx="100"
        cy="100"
        r="72"
        fill="none"
        stroke="var(--brand-green-deep)"
        strokeOpacity="0.55"
        strokeWidth="4"
      />
      <text
        x="100"
        y="101"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Poppins, ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize="96"
        fill="var(--brand-green-deep)"
      >
        $
      </text>
      {/* Sheen */}
      <circle cx="100" cy="100" r="88" fill={`url(#${sheen})`} />
    </svg>
  );
}
