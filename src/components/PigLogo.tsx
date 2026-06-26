import { cn } from "@/lib/utils";

/**
 * Subtle, friendly pig mark for OinkAI. Geometric and modern — not cartoonish.
 */
export function PigLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-hidden="true"
    >
      {/* ears */}
      <path
        d="M13 12c-2.5-3-6-3.2-7 0-.9 3 1.2 6.5 4.5 7.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 12c2.5-3 6-3.2 7 0 .9 3-1.2 6.5-4.5 7.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* head */}
      <path
        d="M24 11c8.8 0 15 6 15 14s-6.2 14-15 14S9 33 9 25 15.2 11 24 11Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="3"
      />
      {/* snout */}
      <rect x="18" y="24" width="12" height="9" rx="4.5" fill="currentColor" />
      <circle cx="22" cy="28.5" r="1.4" fill="var(--color-card)" />
      <circle cx="26" cy="28.5" r="1.4" fill="var(--color-card)" />
      {/* eyes */}
      <circle cx="18.5" cy="21" r="1.6" fill="currentColor" />
      <circle cx="29.5" cy="21" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PigLogo className="h-8 w-8" />
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        Oink<span className="text-primary">AI</span>
      </span>
    </div>
  );
}
