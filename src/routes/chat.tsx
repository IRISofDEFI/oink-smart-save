import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PigLogo } from "@/components/PigLogo";
import { Button } from "@/components/ui/button";
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
  "How much have I saved?",
];

function botReply(input: string, totalLocked: number): string {
  const t = input.toLowerCase();
  if (t.includes("lock") && /\d/.test(t)) {
    return "Love it! 🐷 I've set that lock up as a preview for you — just confirm the amount and date and your savings are tucked away safely.";
  }
  if (t.includes("show") || t.includes("locks")) {
    return "You've got a few savings locks running right now. Head to your Savings tab to see each one with the days remaining.";
  }
  if (t.includes("saved") || t.includes("how much")) {
    return `You currently have ${totalLocked.toLocaleString()} USDC locked away. Nicely done — that's money your future self will thank you for!`;
  }
  return "Got it! I can help you lock USDC, check your balance, or review your savings. What would you like to do?";
}

function Chat() {
  const { totalLocked } = useOink();
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      from: "ai",
      text: "Hi, I'm OinkAI 🐷 I'm here to help you save. Tell me what you'd like to do, or tap a suggestion below.",
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
    const mine: Msg = { id: `m-${Date.now()}`, from: "me", text: trimmed };
    setMessages((prev) => [...prev, mine]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          from: "ai",
          text: botReply(trimmed, totalLocked),
        },
      ]);
    }, 600);
  };

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-9rem)] flex-col">
        {/* Suggestions */}
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 pb-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${m.from === "me" ? "justify-end" : "justify-start"}`}
            >
              {m.from === "ai" && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card shadow-sm">
                  <PigLogo className="h-5 w-5" />
                </span>
              )}
              <div
                className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                  m.from === "me"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-card text-foreground shadow-card"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-20 flex items-center gap-2 rounded-full border border-border bg-card p-2 shadow-card sm:bottom-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message OinkAI…"
            className="flex-1 bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full shadow-soft"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
