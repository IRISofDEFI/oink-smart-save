import { Github, X as XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function NotionIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-[6px] border border-current text-[11px] font-bold leading-none",
        className,
      )}
    >
      N
    </span>
  );
}

export const links = {
  arcX: { href: "https://x.com/arc?s=20", title: "Arc on X", icon: XIcon },
  oinkX: { href: "https://x.com/oink_AI?s=20", title: "OinkAI on X", icon: XIcon },
  github: {
    href: "https://github.com/IRISofDEFI/oink-smart-save",
    title: "OinkAI on GitHub",
    icon: Github,
  },
  whitepaper: {
    href: "https://app.notion.com/p/OinkAI-38e56c2fe03e80699f29ef0d14e94248?source=copy_link",
    title: "OinkAI Whitepaper",
    icon: NotionIcon,
  },
};

export const socialLinks = [links.arcX, links.oinkX, links.github, links.whitepaper];
