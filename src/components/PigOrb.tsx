import { cn } from "@/lib/utils";
import pigOrb from "@/assets/pig-orb.png";

export function PigOrb({
  className,
  float = true,
  priority = false,
}: {
  className?: string;
  float?: boolean;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <div className="absolute inset-0 -z-10 rounded-full bg-gradient-brand opacity-50 blur-3xl animate-pulse-glow" />
      <img
        src={pigOrb}
        alt="OinkAI, a glowing AI savings companion"
        width={1024}
        height={1024}
        loading={priority ? "eager" : "lazy"}
        className={cn("h-full w-full object-contain drop-shadow-[0_10px_40px_oklch(0.58_0.24_290_/_0.55)]", float && "animate-float")}
      />
    </div>
  );
}

/** Cosmic starfield + nebula glow backdrop. */
export function CosmicBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 top-[-10%] h-[40rem] w-[40rem] rounded-full bg-blue/20 blur-[120px]" />
      <div className="absolute -right-32 top-1/3 h-[36rem] w-[36rem] rounded-full bg-purple/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, white 1px, transparent 0), radial-gradient(1px 1px at 70% 60%, white 1px, transparent 0), radial-gradient(1px 1px at 40% 80%, white 1px, transparent 0), radial-gradient(1px 1px at 85% 20%, white 1px, transparent 0), radial-gradient(1px 1px at 55% 15%, white 1px, transparent 0), radial-gradient(1px 1px at 10% 70%, white 1px, transparent 0)",
          backgroundSize: "100% 100%",
        }}
      />
    </div>
  );
}
