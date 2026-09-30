import { ChartLine, Lock, Mail, MessageCircleMore, type LucideIcon } from "lucide-react";

/**
 * Feature strip cards (Section C). Add a feature by adding one entry here —
 * the layout adapts: the coin slot stays in the middle of the row, and the
 * mobile grid wraps two per row.
 *
 * tint: "light" = brand-light tile with a brand-dark icon,
 *       "dark"  = brand-dark tile with a white icon.
 */
export type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tint: "light" | "dark";
};

export const featureCards: FeatureCard[] = [
  {
    id: "chat-to-save",
    title: "Chat to Save",
    description: "No menus, no jargon — only a friendly conversation.",
    icon: MessageCircleMore,
    tint: "light",
  },
  {
    id: "lock-usdc",
    title: "Lock USDC",
    // TODO: COPY — shortened from the Lock USDC feature copy
    description: "Safe from impulse spending until the day you chose.",
    icon: Lock,
    tint: "dark",
  },
  {
    id: "track-savings",
    title: "Track Your Savings",
    // TODO: COPY — shortened from the Track Your Savings feature copy
    description: "Your balance, locks and days left in one clear place.",
    icon: ChartLine,
    tint: "light",
  },
  {
    id: "email-onboarding",
    title: "Sign up with email",
    // TODO: COPY — shortened from the Email-Onboarding roadmap copy
    description: "Circle provisions the wallet — no seed phrase to write down.",
    icon: Mail,
    tint: "dark",
  },
];
