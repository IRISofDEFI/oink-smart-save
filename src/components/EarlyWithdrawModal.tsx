import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type OinkLock, formatUsdcAmount, daysRemaining } from "@/hooks/useOinkLocks";

export function EarlyWithdrawModal({
  lock,
  isOpen,
  onClose,
  onConfirm,
}: {
  lock: OinkLock | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!lock) return null;

  const days = daysRemaining(lock.unlockAt);
  const amount = formatUsdcAmount(lock.amount);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="rounded-3xl border-border bg-card/95 backdrop-blur-xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">🐷 Are you sure?</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            You still have{" "}
            <span className="font-bold text-foreground">{days}d</span> left on this lock.
            Withdrawing now defeats the purpose of saving. Are you sure you want to withdraw{" "}
            <span className="font-bold text-foreground">{amount} USDC</span> early?
          </p>

          {/* Primary action — the "right" choice: wait */}
          <Button
            size="lg"
            className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white transition-shadow hover:glow-purple"
            onClick={onClose}
          >
            Never mind, I'll wait
          </Button>

          {/* Secondary action — the "wrong" choice: intentionally small and muted */}
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl border border-amber-500/30 py-2.5 text-sm font-medium text-amber-400/70 transition-colors hover:border-amber-500/60 hover:text-amber-400"
          >
            Yes, withdraw early
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Your savings discipline matters.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
