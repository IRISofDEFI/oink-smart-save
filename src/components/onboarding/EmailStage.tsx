import { useState, type FormEvent } from "react";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailStage({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: (email: string) => void;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-[0_8px_30px_-6px_oklch(0.47_0.1_155.6_/_0.7)]">
          <Mail className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-foreground">Sign up with email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll create a secure wallet for you — no seed phrase, no browser extension.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onboarding-email">Email address</Label>
        <Input
          id="onboarding-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={pending}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 rounded-2xl border-border bg-secondary/40 px-4 text-base"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={pending || !value}
        className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white transition-shadow hover:glow-purple"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending code...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  );
}
