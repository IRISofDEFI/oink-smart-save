import { useEffect, useRef, useState } from "react";
import { MailCheck, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const RESEND_COOLDOWN_SECONDS = 30;

export function OtpStage({
  email,
  pending,
  error,
  onVerify,
  onResend,
}: {
  email: string;
  pending: boolean;
  error: string | null;
  onVerify: () => void;
  onResend: () => Promise<void>;
}) {
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      startCooldown();
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-5 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-[0_8px_30px_-6px_oklch(0.47_0.1_155.6_/_0.7)]">
        <MailCheck className="h-7 w-7" />
      </span>

      <div>
        <h1 className="text-xl font-bold text-foreground">Check your inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a verification code to
          <br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <Button
        size="lg"
        onClick={onVerify}
        className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white transition-shadow hover:glow-purple"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Waiting for verification...
          </>
        ) : (
          "Enter verification code"
        )}
      </Button>

      {pending && (
        <p className="text-xs text-muted-foreground">
          A verification window should have opened. Closed it by mistake? Click the button above to reopen it.
        </p>
      )}

      <button
        type="button"
        onClick={() => { void handleResend(); }}
        disabled={resending || cooldown > 0}
        className="mx-auto flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {resending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCw className="h-3.5 w-3.5" />
        )}
        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
      </button>
    </div>
  );
}
