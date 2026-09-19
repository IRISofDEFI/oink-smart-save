import { createFileRoute, Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useEmailOnboarding, type OnboardingStage } from "@/hooks/useEmailOnboarding";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { EmailStage } from "@/components/onboarding/EmailStage";
import { OtpStage } from "@/components/onboarding/OtpStage";
import { WalletCreationStage } from "@/components/onboarding/WalletCreationStage";
import { SuccessStage } from "@/components/onboarding/SuccessStage";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up with Email — OinkAI" },
      {
        name: "description",
        content: "Create an OinkAI savings wallet with just your email — no browser extension needed.",
      },
    ],
  }),
  component: SignupPage,
});

const STEP_BY_STAGE: Record<OnboardingStage, 1 | 2 | 3 | 4> = {
  email: 1,
  otp: 2,
  wallet: 3,
  success: 4,
};

function SignupPage() {
  const onboarding = useEmailOnboarding();

  if (onboarding.configError) {
    return (
      <OnboardingShell step={1}>
        <ConfigErrorView message={onboarding.configError} />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step={STEP_BY_STAGE[onboarding.stage]}>
      {onboarding.stage === "email" && (
        <EmailStage
          pending={onboarding.pending}
          error={onboarding.error}
          onSubmit={(email) => { void onboarding.submitEmail(email); }}
        />
      )}

      {onboarding.stage === "otp" && (
        <OtpStage
          email={onboarding.email}
          pending={onboarding.pending}
          error={onboarding.error}
          onVerify={onboarding.openVerify}
          onResend={onboarding.resendOtp}
        />
      )}

      {onboarding.stage === "wallet" && (
        <WalletCreationStage
          pending={onboarding.pending}
          error={onboarding.error}
          awaitingPinSetup={onboarding.awaitingPinSetup}
          onConfirmPinSetup={onboarding.confirmPinSetup}
          onRetryInitialize={onboarding.retryInitialize}
        />
      )}

      {onboarding.stage === "success" && (
        <SuccessStage
          wallet={onboarding.wallet}
          balance={onboarding.balance}
          walletAlreadyExisted={onboarding.walletAlreadyExisted}
        />
      )}
    </OnboardingShell>
  );
}

function ConfigErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
        <TriangleAlert className="h-7 w-7" />
      </span>
      <div>
        <p className="font-semibold text-foreground">Email sign-up unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Link
        to="/"
        className="text-sm font-semibold text-cyan underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
