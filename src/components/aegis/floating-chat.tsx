import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, MessageSquare, Radar, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function submit(text?: string) {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <>
      {open && (
        <div
          className="fixed z-50 bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[70vh] flex flex-col rounded-[12px] overflow-hidden animate-scale-in"
          style={{
            background: "linear-gradient(180deg, rgba(6,12,20,0.96), rgba(2,6,10,0.98))",
            border: "1px solid rgba(34,211,238,0.28)",
            boxShadow: "0 30px 80px -20px rgba(34,211,238,0.4), 0 0 0 1px rgba(0,0,0,0.4)",
            backdropFilter: "blur(16px)",
          }}
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-[rgba(34,211,238,0.15)]">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px]" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)" }}>
                <Radar className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
              </span>
              <div>
                <div style={{ fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>Aegis · Copilot</div>
                <div style={{ fontFamily: SERIF, fontSize: "1rem", color: "#f5f7fa" }}>Ask <em style={{ color: "#22d3ee" }}>Aegis</em></div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-white/5 transition-colors" aria-label="Close">
              <X className="h-4 w-4" style={{ color: "rgba(245,247,250,0.7)" }} />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: "rgba(245,247,250,0.75)", fontFamily: "var(--font-sans)" }}>
                  Grounded in Monad live state. Ask about tokens, whales, opportunities, or daily-life on Monad.
                </p>
                <div className="grid gap-2">
                  {[
                    "What's moving on Monad right now?",
                    "Best safe yield for my paycheck?",
                    "Any whale accumulation in the last hour?",
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => submit(p)}
                      className="text-left text-xs px-3 py-2 rounded-[6px] transition-colors hover:bg-[rgba(34,211,238,0.06)]"
                      style={{ border: "1px solid rgba(34,211,238,0.16)", color: "rgba(245,247,250,0.9)" }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (<MiniMsg key={m.id} m={m} />))}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.7)" }}>
                <Loader2 className="h-3 w-3 animate-spin" /> Reasoning…
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[rgba(34,211,238,0.15)]">
            <div className="relative rounded-[8px]" style={{ background: "rgba(10,18,28,0.7)", border: "1px solid rgba(34,211,238,0.22)" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder="Ask Aegis…"
                rows={1}
                className="w-full resize-none bg-transparent px-3 py-2.5 pr-11 text-sm outline-none"
                style={{ color: "#f5f7fa", fontFamily: "var(--font-sans)" }}
              />
              <button
                onClick={() => submit()}
                disabled={busy || !input.trim()}
                className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-[6px] inline-flex items-center justify-center cta-cyan disabled:opacity-40"
                aria-label="Send"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-50 bottom-5 right-4 sm:right-6 group inline-flex items-center gap-2 pl-4 pr-5 py-3 rounded-full transition-all hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, #22d3ee, #0891b2)",
          color: "#031018",
          boxShadow: "0 20px 40px -12px rgba(34,211,238,0.6), 0 0 0 1px rgba(34,211,238,0.4)",
          fontFamily: "var(--font-display)",
          fontSize: "0.72rem",
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
        aria-label={open ? "Close Aegis" : "Ask Aegis"}
      >
        {open ? <X className="h-4 w-4" strokeWidth={2.5} /> : <MessageSquare className="h-4 w-4" strokeWidth={2.5} />}
        <span>{open ? "Close" : "Ask Aegis"}</span>
      </button>
    </>
  );
}

function MiniMsg({ m }: { m: UIMessage }) {
  const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] px-3 py-2 text-sm"
          style={{
            background: "rgba(34,211,238,0.12)",
            border: "1px solid rgba(34,211,238,0.3)",
            borderRadius: "10px 10px 2px 10px",
            color: "#f5f7fa",
          }}
        >
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="text-sm markdown-body" style={{ color: "rgba(245,247,250,0.92)" }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}