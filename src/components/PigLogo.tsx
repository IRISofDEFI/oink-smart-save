import { cn } from "@/lib/utils";

/**
 * Glowing pig-orb mark for OinkAI. A luminous round face with two glowing eyes
 * and subtle pig ears, filled with a blue-to-purple gradient glow.
 */
export function PigLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="oink-grad" x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stopColor="oklch(0.62 0.2 250)" />
          <stop offset="55%" stopColor="oklch(0.58 0.24 290)" />
          <stop offset="100%" stopColor="oklch(0.6 0.22 320)" />
        </linearGradient>
        <radialGradient id="oink-core" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="oklch(0.75 0.16 270)" />
          <stop offset="100%" stopColor="oklch(0.45 0.2 285)" />
        </radialGradient>
      </defs>
      {/* ears */}
      <path d="M14 12c-2-3.4-6-4-7.6-1.2-1.2 2.2 0 5.4 2.6 6.8" fill="url(#oink-grad)" />
      <path d="M34 12c2-3.4 6-4 7.6-1.2 1.2 2.2 0 5.4-2.6 6.8" fill="url(#oink-grad)" />
      {/* head orb */}
      <circle cx="24" cy="26" r="16" fill="url(#oink-core)" />
      <circle cx="24" cy="26" r="16" fill="none" stroke="url(#oink-grad)" strokeWidth="1.4" strokeOpacity="0.8" />
      {/* glowing eyes */}
      <circle cx="18.5" cy="24" r="2.6" fill="oklch(0.97 0.03 220)" />
      <circle cx="29.5" cy="24" r="2.6" fill="oklch(0.97 0.03 220)" />
      {/* snout */}
      <ellipse cx="24" cy="32" rx="4.5" ry="3" fill="oklch(0.85 0.06 320 / 0.8)" />
      <circle cx="22.4" cy="32" r="0.8" fill="oklch(0.3 0.08 290)" />
      <circle cx="25.6" cy="32" r="0.8" fill="oklch(0.3 0.08 290)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative inline-flex items-center justify-center">
        <span className="absolute inset-0 -z-10 rounded-full bg-gradient-brand blur-md opacity-70" />
        <PigLogo className="h-8 w-8 drop-shadow-[0_0_8px_oklch(0.58_0.24_290_/_0.6)]" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        Oink<span className="text-gradient">AI</span>
      </span>
    </div>
  );
}
