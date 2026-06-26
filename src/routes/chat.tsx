import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PigLogo } from "@/components/PigLogo";
import { useOink } from "@/lib/oink-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [{ title: "Chat — OinkAI" }],
  }),
  component: Chat,
});

interface Msg {
  id: string;
  from: "ai" | "me";
  text: string;
}

const SUGGESTIONS = [
  "Lock 5 USDC for 30 days",
  "Show my locks",
  "Check my balance",
];

function botReply(input: string): string {
  const t = input.toLowerCase();
  if (t.includes("lock") && /\d/.test(t)) {
    return "Love it! I've set that lock up as a preview for you — just confirm the amount and date and your savings are tucked away safely until then.";
  }
  if (t.includes("show") || t.includes("locks")) {
    return "You can see all your active locks on the Dashboard — each one shows the amount and exactly how many days are left before it unlocks.";
  }
  if (t.includes("balance") || t.includes("saved")) {
    return "I'll keep an eye on your balance and your locked savings, and surface them whenever you ask. Everything stays in one calm, clear place.";
  }
  return "Got it! I can help you lock USDC, review your savings, or plan ahead. What would you like to do?";
}

function Chat() {
  useOink();
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      from: "ai",
      text: "Hi, I'm OinkAI. I'm here to help you save with calm and clarity. Tell me what you'd like to do, or tap a suggestion below.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, from: "me", text: trimmed },
    ]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, from: "ai", text: botReply(trimmed) },
      ]);
    }, 600);
  };

  return (
    <AppShell showHeader={false}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col">
        {/* Chat header */}
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
              className={`flex items-end gap-2 ${m.from === "me" ? "justify-end" : "justify-start"}`}
            >
              {m.from === "ai" && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card">
                  <PigLogo className="h-5 w-5" />
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                  m.from === "me"
                    ? "rounded-br-md bg-gradient-brand text-white glow-blue"
                    : "rounded-bl-md border border-border bg-card/70 text-foreground backdrop-blur-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-24 flex items-center gap-2 rounded-full border border-border bg-card/80 p-2 pl-5 backdrop-blur-xl focus-within:glow-blue md:bottom-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message OinkAI…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white transition-shadow hover:glow-purple disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
