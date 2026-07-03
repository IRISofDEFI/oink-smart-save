import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const EXPLORER = "https://testnet.arcscan.app";

export function WithdrawSuccessModal({
  isOpen,
  onClose,
  amount,
  wasEarly,
  txHash,
}: {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  wasEarly: boolean;
  txHash: `0x${string}` | null;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="rounded-3xl border-border bg-card/95 backdrop-blur-xl glow-purple sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            Withdrawal confirmed!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <span className="text-6xl">🐷</span>

          <div>
            <p className="text-lg font-bold text-foreground">
              Withdrew {amount} USDC!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {wasEarly
                ? "Withdrawn early — remember, your future self is watching 🐷"
                : "Well done — you saved for the full duration 🎉"}
            </p>
          </div>

          {txHash && (
            <a
              href={`${EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-purple-400 hover:underline"
            >
              View on explorer <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <Button
            size="lg"
            className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white hover:glow-purple"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
