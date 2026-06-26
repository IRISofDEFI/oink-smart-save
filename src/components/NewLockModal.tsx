import { useMemo, useState } from "react";
import { Plus, Lock as LockIcon, CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOink, formatDate } from "@/lib/oink-store";
import { cn } from "@/lib/utils";

const DURATION_PRESETS = [7, 30, 90, 180];

export function NewLockModal({ trigger }: { trigger?: React.ReactNode }) {
  const { addLock } = useOink();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(30);

  const numericAmount = parseFloat(amount) || 0;
  const valid = numericAmount > 0 && duration > 0;

  const unlockDate = useMemo(
    () => Date.now() + duration * 24 * 60 * 60 * 1000,
    [duration],
  );

  const reset = () => {
    setAmount("");
    setDuration(30);
  };

  const handleConfirm = () => {
    if (!valid) return;
    addLock(numericAmount, duration);
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="rounded-full font-semibold shadow-soft">
            <Plus className="h-5 w-5" />
            New Lock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-border/70 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockIcon className="h-4 w-4" />
            </span>
            Lock some savings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 rounded-2xl pr-16 text-2xl font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                USDC
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lock for</Label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-2xl border px-2 py-3 text-sm font-semibold transition-colors",
                    duration === d
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-cream p-4">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-foreground">
              You're locking{" "}
              <span className="font-bold">
                {numericAmount > 0 ? numericAmount : "—"} USDC
              </span>{" "}
              until{" "}
              <span className="font-bold">{formatDate(unlockDate)}</span>. You
              won't be able to touch it until then.
            </p>
          </div>

          <Button
            size="lg"
            className="h-12 w-full rounded-2xl text-base font-semibold shadow-soft"
            disabled={!valid}
            onClick={handleConfirm}
          >
            Confirm lock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
