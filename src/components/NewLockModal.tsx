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

const DURATION_PRESETS = [7, 14, 30, 60, 90];

export function NewLockModal({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { addLock } = useOink();
  const [internalOpen, setInternalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(30);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (o: boolean) => {
    if (!isControlled) setInternalOpen(o);
    onOpenChange?.(o);
  };

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
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button size="lg" className="rounded-full bg-gradient-brand font-semibold text-white">
            <Plus className="h-5 w-5" />
            New Lock
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="rounded-3xl border-border bg-card/95 backdrop-blur-xl glow-purple sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-brand text-white">
              <LockIcon className="h-5 w-5" />
            </span>
            Create a new lock
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
                className="h-16 rounded-2xl border-border bg-secondary/40 pr-16 text-3xl font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                USDC
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lock for</Label>
            <div className="grid grid-cols-5 gap-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-2xl border px-1 py-3 text-sm font-semibold transition-all",
                    duration === d
                      ? "border-transparent bg-gradient-brand text-white glow-blue"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
            <p className="text-sm leading-relaxed text-foreground">
              You're locking{" "}
              <span className="font-bold text-gradient">
                {numericAmount > 0 ? numericAmount : "—"} USDC
              </span>{" "}
              until <span className="font-bold">{formatDate(unlockDate)}</span>.
              You won't be able to withdraw before then.
            </p>
          </div>

          <Button
            size="lg"
            className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white transition-shadow hover:glow-purple"
            disabled={!valid}
            onClick={handleConfirm}
          >
            Confirm Lock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
