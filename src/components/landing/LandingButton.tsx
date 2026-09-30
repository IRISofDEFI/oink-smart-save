import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Landing-only button. Kept separate from ui/button.tsx so the app screens'
 * buttons are unaffected. Contrast rule: brand-light fills always carry ink
 * text; brand-light is never used as text on white.
 */
const landingButtonVariants = cva(
  "inline-flex h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] pl-4 pr-3.5 text-[15px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Primary on dark backgrounds. */
        light: "bg-brand-light text-ink hover:bg-brand-light/85",
        /** Primary on white backgrounds. */
        dark: "bg-brand-dark text-white hover:bg-brand-dark/90",
        /** Secondary on dark backgrounds. */
        outline: "border border-white/70 bg-transparent text-white hover:bg-white/10",
        /** Navbar button. */
        charcoal: "bg-charcoal text-white hover:bg-white hover:text-ink",
        /** Text link on dark backgrounds. */
        link: "h-auto px-0 pl-0 pr-0 text-white/60 hover:text-white",
      },
    },
    defaultVariants: { variant: "dark" },
  },
);

export interface LandingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof landingButtonVariants> {
  asChild?: boolean;
}

export const LandingButton = React.forwardRef<HTMLButtonElement, LandingButtonProps>(
  ({ className, variant, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(landingButtonVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
LandingButton.displayName = "LandingButton";
