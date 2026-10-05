import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WalletCreationStage({
  pending,
  error,
  awaitingWalletSetup,
  onConfirmWalletSetup,
  onRetryInitialize,
}: {
  pending: boolean;
  error: string | null;
  awaitingWalletSetup: boolean;
  onConfirmWalletSetup: () => void;
  onRetryInitialize: () => void;
}) {
  // Error during either the initial account check or Circle's setup screen.
  if (error) {
    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <span className="text-5xl">⚠️</span>
        <div>
          <p className="font-semibold text-foreground">Wallet setup didn't finish</p>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
        <Button
          size="lg"
          onClick={awaitingWalletSetup ? onConfirmWalletSetup : onRetryInitialize}
          className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white hover:glow-purple"
        >
          Try again
        </Button>
      </div>
    );
  }

  // Waiting while the user finishes on Circle's secure screen.
  if (awaitingWalletSetup && pending) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand/20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Setting up your wallet...</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Finish the steps on Circle's secure screen to create your wallet.
          </p>
        </div>
      </div>
    );
  }

  // Not yet checked whether this user already has a wallet.
  if (!awaitingWalletSetup) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand/20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
        <p className="font-semibold text-foreground">Setting up your account...</p>
      </div>
    );
  }

  // Circle needs one more step to create this user's wallet. What its secure
  // screen asks for is Circle's choice — usually just a confirmation. If it
  // does ask for a PIN or security questions, those can't be recovered.
  return (
    <div className="space-y-5">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white glow-tile">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-foreground">Create your wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Circle, our wallet provider, will open a secure screen to finish creating your wallet.
          Review it and confirm there.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4 text-left text-sm leading-relaxed text-muted-foreground">
        <p>
          Your email is how you get back into your wallet — no seed phrase to write down.
        </p>
        <p className="mt-2">
          If Circle's screen asks you to create a PIN or security questions, write them down
          somewhere safe: neither OinkAI nor Circle can reset them.
        </p>
      </div>

      <Button
        size="lg"
        onClick={onConfirmWalletSetup}
        className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white transition-shadow hover:glow-purple"
      >
        Continue to Circle
      </Button>
    </div>
  );
}
