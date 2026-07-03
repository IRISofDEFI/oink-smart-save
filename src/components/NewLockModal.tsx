import { useMemo, useState } from "react";
import { Plus, Lock as LockIcon, CalendarClock, Loader2, ExternalLink } from "lucide-react";
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
import { useLockUsdc, type LockState } from "@/hooks/useLockUsdc";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { cn } from "@/lib/utils";

const EXPLORER = "https://testnet.arcscan.app";
const DURATION_PRESETS = [7, 30, 60, 90, 180, 365];
const PENDING_STATES: LockState[] = [
  "checking-allowance",
  "approving",
  "approve-pending",
  "locking",
  "lock-pending",
];

export function NewLockModal({
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const lockUsdc = useLockUsdc();
  const { balance } = useUsdcBalance();

  const [internalOpen, setInternalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [formError, setFormError] = useState<string | null>(null);
  const [lockedAmount, setLockedAmount] = useState("");
  const [lockedDays, setLockedDays] = useState(0);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const isPending = PENDING_STATES.includes(lockUsdc.state);
  const numericAmount = parseFloat(amount) || 0;
  const maxBalance = balance !== null ? parseFloat(balance) : 0;

  const unlockDateStr = useMemo(
    () =>
      new Date(Date.now() + duration * 86_400 * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [duration],
  );

  const resetAll = () => {
    setAmount("");
    setDuration(30);
    setFormError(null);
    setLockedAmount("");
    setLockedDays(0);
    // Delay hook reset so the success/error view persists through the close animation
    setTimeout(() => lockUsdc.reset(), 200);
  };

  const setOpen = (o: boolean) => {
    if (!o && isPending) return; // block close while a tx is in flight
    if (!isControlled) setInternalOpen(o);
    onOpenChange?.(o);
    if (!o) resetAll();
  };

  const handleConfirm = async () => {
    setFormError(null);
    if (numericAmount <= 0) {
      setFormError("Enter an amount greater than 0");
      return;
    }
    if (maxBalance > 0 && numericAmount > maxBalance) {
      setFormError(`Insufficient balance (max ${balance} USDC)`);
      return;
    }
    if (duration < 1 || duration > 3650) {
      setFormError("Duration must be between 1 and 3650 days");
      return;
    }
    setLockedAmount(amount);
    setLockedDays(duration);
    await lockUsdc.executeLock(amount, duration);
  };

  const handleDone = () => {
    onSuccess?.();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

      <DialogContent
        className="rounded-3xl border-border bg-card/95 backdrop-blur-xl glow-purple sm:max-w-md"
        onEscapeKeyDown={(e) => { if (isPending) e.preventDefault(); }}
        onInteractOutside={(e) => { if (isPending) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-brand text-white">
              <LockIcon className="h-5 w-5" />
            </span>
            {lockUsdc.state === "success"
              ? "Lock confirmed!"
              : lockUsdc.state === "error"
                ? "Transaction failed"
                : "Create a new lock"}
          </DialogTitle>
        </DialogHeader>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        {lockUsdc.state === "idle" && (
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lock-amount">Amount</Label>
                {balance !== null && (
                  <span className="text-xs text-muted-foreground">
                    Balance:{" "}
                    <span className="font-semibold text-foreground">{balance} USDC</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="lock-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setFormError(null); }}
                  className="h-16 rounded-2xl border-border bg-secondary/40 pr-24 text-3xl font-bold"
                />
                {balance !== null && (
                  <button
                    type="button"
                    onClick={() => setAmount(balance)}
                    className="absolute right-[52px] top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400 transition-colors hover:text-purple-300"
                  >
                    Max
                  </button>
                )}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  USDC
                </span>
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
            </div>

            <div className="space-y-2">
              <Label>Lock for</Label>
              <div className="grid grid-cols-3 gap-2">
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
                until <span className="font-bold">{unlockDateStr}</span>.
                You won't be able to withdraw before then.
              </p>
            </div>

            <Button
              size="lg"
              className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white transition-shadow hover:glow-purple"
              disabled={numericAmount <= 0}
              onClick={() => { void handleConfirm(); }}
            >
              Confirm Lock
            </Button>
          </div>
        )}

        {/* ── Progress ────────────────────────────────────────────────────── */}
        {isPending && (
          <ProgressView
            state={lockUsdc.state}
            approvalSkipped={lockUsdc.approvalSkipped}
            currentTxHash={lockUsdc.currentTxHash}
          />
        )}

        {/* ── Success ─────────────────────────────────────────────────────── */}
        {lockUsdc.state === "success" && (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <span className="text-6xl">🐷</span>
            <div>
              <p className="text-lg font-bold text-foreground">
                {lockedAmount} USDC locked for {lockedDays} days
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Unlocks on{" "}
                {new Date(Date.now() + lockedDays * 86_400 * 1000).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" },
                )}
              </p>
            </div>
            {lockUsdc.currentTxHash && (
              <a
                href={`${EXPLORER}/tx/${lockUsdc.currentTxHash}`}
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
              onClick={handleDone}
            >
              Done
            </Button>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {lockUsdc.state === "error" && (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <span className="text-5xl">⚠️</span>
            <div>
              <p className="font-semibold text-foreground">Transaction failed</p>
              <p className="mt-1 text-sm text-red-400">{lockUsdc.errorMessage}</p>
            </div>
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-12 flex-1 rounded-2xl border-border"
                onClick={lockUsdc.reset}
              >
                Try again
              </Button>
              <Button
                size="lg"
                className="h-12 flex-1 rounded-2xl bg-gradient-brand text-white hover:glow-purple"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-component: progress spinner shown during the two-step tx flow ─────────

function ProgressView({
  state,
  approvalSkipped,
  currentTxHash,
}: {
  state: LockState;
  approvalSkipped: boolean;
  currentTxHash: `0x${string}` | null;
}) {
  let label = "";
  let desc = "";
  const twoStep = !approvalSkipped;

  switch (state) {
    case "checking-allowance":
      label = "Checking USDC allowance...";
      break;
    case "approving":
      label = "Step 1 of 2: Approve USDC";
      desc = "Sign in your wallet";
      break;
    case "approve-pending":
      label = "Step 1 of 2: Approve USDC";
      desc = "Waiting for confirmation...";
      break;
    case "locking":
      label = twoStep ? "Step 2 of 2: Lock USDC" : "Locking USDC";
      desc = "Sign in your wallet";
      break;
    case "lock-pending":
      label = twoStep ? "Step 2 of 2: Lock USDC" : "Locking USDC";
      desc = "Waiting for confirmation...";
      break;
  }

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand/20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{label}</p>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {currentTxHash && (
        <a
          href={`${EXPLORER}/tx/${currentTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-purple-400 hover:underline"
        >
          View on explorer <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
