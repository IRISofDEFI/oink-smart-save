import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PigLogo } from "@/components/PigLogo";
import { useOinkAgent } from "@/hooks/useOinkAgent";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [{ title: "Chat — OinkAI" }],
  }),
  component: Chat,
});

const SUGGESTIONS = [
  "Lock 5 USDC for 30 days",
  "Show my locks",
  "Check my balance",
];

function Chat() {
  const {
    messages,
    isThinking,
    isConfirming,
    pendingAction,
    sendMessage,
    confirmAction,
    cancelAction,
  } = useOinkAgent();

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isConfirming, pendingAction]);

  const inputDisabled = isThinking || isConfirming || !!pendingAction;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;
    const text = input.value;
    input.value = "";
    void sendMessage(text);
  };

  const handleSuggestion = (text: string) => {
    void sendMessage(text);
  };

  return (
    <AppShell showHeader={false}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card glow-blue">
            <PigLogo className="h-7 w-7" />
          </span>
          <div>
            <p className="font-bold text-foreground">OinkAI</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 py-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card">
                  <PigLogo className="h-5 w-5" />
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-gradient-brand text-white glow-blue"
                    : "rounded-bl-md border border-border bg-card/70 text-foreground backdrop-blur-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex items-end gap-2 justify-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card">
                <PigLogo className="h-5 w-5" />
              </span>
              <div className="rounded-3xl rounded-bl-md border border-border bg-card/70 px-4 py-3 backdrop-blur-sm">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          {/* Pending action confirmation card */}
          {pendingAction && !isConfirming && (
            <div className="flex items-end gap-2 justify-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card">
                <PigLogo className="h-5 w-5" />
              </span>
              <div className="max-w-[80%] rounded-3xl rounded-bl-md border border-purple-500/40 bg-card/80 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm font-semibold text-foreground">
                  {pendingAction.type === "lock"
                    ? `Lock ${pendingAction.amount} USDC for ${pendingAction.durationDays} days?`
                    : `Withdraw ${pendingAction.amount} USDC${pendingAction.isEarly ? " (early)" : ""}?`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pendingAction.type === "lock"
                    ? `Unlocks ${pendingAction.unlockDate}`
                    : pendingAction.isEarly
                    ? "This lock hasn't matured yet — withdrawing ends it early."
                    : "Your lock has matured — you've earned it!"}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={confirmAction}
                    className="rounded-full bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-white transition-shadow hover:glow-purple"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={cancelAction}
                    className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirming tx indicator */}
          {isConfirming && (
            <div className="flex items-end gap-2 justify-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card">
                <PigLogo className="h-5 w-5" />
              </span>
              <div className="rounded-3xl rounded-bl-md border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Waiting for wallet confirmation…
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              disabled={inputDisabled}
              className="rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="sticky bottom-24 flex items-center gap-2 rounded-full border border-border bg-card/80 p-2 pl-5 backdrop-blur-xl focus-within:glow-blue md:bottom-4"
        >
          <input
            ref={inputRef}
            disabled={inputDisabled}
            placeholder={
              isConfirming
                ? "Waiting for transaction…"
                : pendingAction
                ? "Confirm or cancel above first"
                : "Message OinkAI…"
            }
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={inputDisabled}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white transition-shadow hover:glow-purple disabled:opacity-40"
            aria-label="Send"
          >
            {isThinking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
