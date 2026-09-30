import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

import { Wordmark } from "@/components/PigLogo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { LandingButton } from "./LandingButton";

// In-page anchors: the landing page's real destinations.
export const navLinks = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "Roadmap", id: "roadmap" },
  { label: "About", id: "about" },
];

export function scrollToSection(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Section A. Fixed; transparent at the top, then a blurred ink bar once the
 * page has scrolled past 24px (Revio's threshold and 300ms transition).
 */
export function Navbar({ onLaunchApp }: { onLaunchApp: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full border-b transition-[padding,background-color,border-color] duration-300",
        scrolled
          ? "border-white/10 bg-ink/90 py-4 backdrop-blur-md"
          : "border-transparent pt-6 md:pt-10",
      )}
    >
      <Container className="flex items-center justify-between">
        <a
          href="/"
          aria-label="OinkAI home"
          className="flex w-fit items-center md:w-[30%] xl:w-[35%]"
        >
          <Wordmark />
        </a>

        {/* Desktop links */}
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => scrollToSection(l.id)}
              className="cursor-pointer whitespace-nowrap px-4 py-2 text-[15px] text-white transition-colors hover:text-brand-light"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden w-fit justify-end lg:flex md:w-[30%] xl:w-[35%]">
          <LandingButton variant="charcoal" onClick={onLaunchApp}>
            Launch app
          </LandingButton>
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-11 w-11 cursor-pointer items-center justify-center text-white lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent aria-describedby={undefined} className="flex flex-col border-white/10 bg-ink">
            <SheetTitle className="border-b border-white/10 pb-4">
              <Wordmark />
            </SheetTitle>
            <nav aria-label="Main" className="flex flex-col gap-2">
              {navLinks.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    // Wait for the sheet to release its scroll lock before scrolling.
                    window.setTimeout(() => scrollToSection(l.id), 350);
                  }}
                  className="cursor-pointer py-2 text-left text-white/70 transition-colors hover:text-brand-light"
                >
                  {l.label}
                </button>
              ))}
            </nav>
            <LandingButton
              variant="light"
              className="mt-4 w-full"
              onClick={() => {
                setOpen(false);
                onLaunchApp();
              }}
            >
              Launch app
            </LandingButton>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}
