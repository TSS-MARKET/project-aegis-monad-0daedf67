import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";
import { GlassCard } from "@/components/aegis/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";

export const Route = createFileRoute("/app/chat")({ component: ChatPage });

const suggestions = [
  "Summarize the Monad ecosystem right now",
  "Which AI tokens on Monad look strongest?",
  "Explain the recent whale activity",
  "What are the biggest risks in the market today?",
];

function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function submit(text?: string) {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10 flex flex-col h-[calc(100vh-0px)]">
      <header className="pb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Analyst</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ask Aegis</h1>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 pb-6">
        {messages.length === 0 && (
          <GlassCard>
            <p className="text-sm text-muted-foreground">
              Aegis is grounded in the live Monad market state. Every answer cites specific tokens and numbers.
            </p>
            <div className="mt-4 grid md:grid-cols-2 gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-left text-sm p-3 rounded-lg border border-border/60 hover:border-primary/60 hover:bg-card/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </GlassCard>
        )}
        {messages.map((m: UIMessage) => (
          <Message key={m.id} m={m} />
        ))}
        {busy && <div className="text-xs text-muted-foreground animate-pulse-glow">Aegis is thinking…</div>}
      </div>

      <div className="border-t border-border/60 pt-4">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask about Monad tokens, narratives, whales, opportunities…"
            className="min-h-[80px] pr-14 bg-card/60"
          />
          <Button size="icon" className="absolute right-2 bottom-2 h-9 w-9" disabled={busy || !input.trim()} onClick={() => submit()}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Message({ m }: { m: UIMessage }) {
  const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">{text}</div>
      </div>
    );
  }
  return (
    <div className="max-w-[85%]">
      <div className="text-[10px] uppercase tracking-widest text-primary mb-1">Aegis</div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
    </div>
  );
}