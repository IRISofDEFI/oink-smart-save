import { Loader2, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WalletCreationStage({
  pending,
  error,
  awaitingPinSetup,
  onConfirmPinSetup,
  onRetryInitialize,
}: {
  pending: boolean;
  error: string | null;
  awaitingPinSetup: boolean;
  onConfirmPinSetup: () => void;
  onRetryInitialize: () => void;
}) {
  // Error during either the initial account check or the PIN challenge.
  if (error) {
    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <span className="text-5xl">⚠️</span>
        <div>
          <p className="font-semibold text-foreground">Wallet setup failed</p>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
        <Button
          size="lg"
          onClick={awaitingPinSetup ? onConfirmPinSetup : onRetryInitialize}
          className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white hover:glow-purple"
        >
          Try again
        </Button>
      </div>
    );
  }

  // Waiting on Circle's hosted PIN-setup iframe the user just opened.
  if (awaitingPinSetup && pending) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand/20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Setting up your wallet...</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Finish setting your PIN and security questions in the window that opened.
          </p>
        </div>
      </div>
    );
  }

  // Not yet checked whether this user already has a wallet.
  if (!awaitingPinSetup) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand/20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
        <p className="font-semibold text-foreground">Setting up your account...</p>
      </div>
    );
  }

  // New user: challengeId is ready. Show the critical PIN warning before
  // opening Circle's hosted PIN-setup UI.
  return (
    <div className="space-y-5">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-[0_8px_30px_-6px_oklch(0.47_0.1_155.6_/_0.7)]">
          <KeyRound className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-foreground">Set your wallet PIN</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Next you'll choose a 6-digit PIN and answer 3 security questions.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
        <div className="space-y-1 text-left">
          <p className="text-sm font-bold text-red-300">This cannot be recovered</p>
          <p className="text-sm leading-relaxed text-red-200/90">
            Neither OinkAI nor Circle can reset your PIN. If you forget it{" "}
            <span className="font-semibold">and</span> your security answers, your wallet — and
            any funds in it — is permanently unrecoverable.
          </p>
          <p className="text-sm font-semibold text-red-200">
            Write your PIN and answers down somewhere safe before continuing.
          </p>
        </div>
      </div>

      <Button
        size="lg"
        onClick={onConfirmPinSetup}
        className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white transition-shadow hover:glow-purple"
      >
        I understand — continue
      </Button>
    </div>
  );
}
