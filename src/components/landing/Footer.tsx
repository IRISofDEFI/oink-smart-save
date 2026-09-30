import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Wordmark } from "@/components/PigLogo";
import { Container } from "./Container";
import { LandingButton } from "./LandingButton";
import { socialLinks } from "./links";
import { FadeUp } from "./motion";
import { navLinks, scrollToSection } from "./Navbar";

/** Revio's shared CTA band (dark). */
export function CTA() {
  return (
    <section className="overflow-hidden bg-ink pb-8 pt-12 text-white md:pt-20 xl:pt-24">
      <Container>
        <div className="mx-auto max-w-[721px] text-center">
          <FadeUp className="mb-6">
            {/* TODO: COPY — closing headline */}
            <h2 className="text-balance text-[36px] font-semibold leading-[1.15] tracking-tight md:text-[54px] lg:text-[68px]">
              Ready to save smarter?
            </h2>
          </FadeUp>
          <FadeUp delay={0.1} className="mb-10">
            <p className="text-lg text-white/60">
              Lock USDC, chat to save, and watch your savings grow with OinkAI.
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <LandingButton variant="light" asChild>
              <Link to="/signup">
                Sign up with email
                <ArrowRight />
              </Link>
            </LandingButton>
          </FadeUp>
        </div>
      </Container>
    </section>
  );
}

export function Footer({ onLaunchApp }: { onLaunchApp: () => void }) {
  const linkClass = "cursor-pointer text-white/60 transition-colors hover:text-white";

  return (
    <footer className="relative bg-ink pb-8 pt-24 text-white md:pt-36">
      <Container>
        <div className="mb-12 flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-[310px] space-y-8 md:space-y-[60px]">
            <div>
              <a href="/" aria-label="OinkAI home" className="mb-6 inline-block">
                <Wordmark />
              </a>
              <p className="text-white/60">
                Your money, locked by you — until you're ready.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <img src="/arc-logo.png" alt="" className="h-6 w-auto object-contain" />
              Powered by Arc
            </div>
          </div>

          <div className="grid max-w-[537px] grid-cols-1 gap-10 sm:grid-cols-3">
            <FadeUp delay={0.1}>
              <h3 className="mb-6 text-lg font-semibold">Explore</h3>
              <ul className="space-y-3">
                {navLinks.map((l) => (
                  <li key={l.id}>
                    <button type="button" onClick={() => scrollToSection(l.id)} className={linkClass}>
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </FadeUp>
            <FadeUp delay={0.2}>
              <h3 className="mb-6 text-lg font-semibold">Get started</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/signup" className={linkClass}>
                    Sign up with email
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={onLaunchApp} className={linkClass}>
                    Launch app
                  </button>
                </li>
              </ul>
            </FadeUp>
            <FadeUp delay={0.3}>
              <h3 className="mb-6 text-lg font-semibold">Community</h3>
              <ul className="space-y-3">
                {socialLinks.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>
        </div>

        <FadeUp delay={0.3} className="mt-8 border-t border-charcoal pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-white/60 md:text-left">
              © {new Date().getFullYear()} OinkAI. Built on Arc Testnet.
            </p>
            <div className="flex items-center gap-6">
              {socialLinks.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.title}
                  aria-label={s.title}
                  className="text-white/60 transition-colors hover:text-white"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </FadeUp>
      </Container>
    </footer>
  );
}
