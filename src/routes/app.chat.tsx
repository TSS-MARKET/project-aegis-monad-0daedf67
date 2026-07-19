import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, TrendingUp, Fish, ShieldAlert, Radar, Loader2, LinkIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getEventFeed } from "@/lib/intelligence.functions";
import { z } from "zod";

const chatSearchSchema = z.object({
  q: z.string().optional(),
  eventId: z.string().optional(),
  focus: z.string().optional(),
});

export const Route = createFileRoute("/app/chat")({
  component: ChatPage,
  validateSearch: chatSearchSchema,
});

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";

const suggestions = [
  { icon: Sparkles, label: "Ecosystem read", prompt: "Give me a full read on the Monad ecosystem right now — sentiment, dominant narrative, key movers." },
  { icon: TrendingUp, label: "Strongest AI plays", prompt: "Which AI-narrative tokens on Monad look strongest right now, and why?" },
  { icon: Fish, label: "Whale activity", prompt: "Walk me through the most important whale activity in the last hour and what it implies." },
  { icon: ShieldAlert, label: "Biggest risks", prompt: "What are the biggest risks in the Monad market right now?" },
];

function ChatPage() {
  const { q, eventId, focus } = Route.useSearch();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ eventId, focus }),
    }),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSent = useRef(false);

  const fetchFeed = useServerFn(getEventFeed);
  const { data: feed } = useQuery({
    queryKey: ["chat-evidence-rail"],
    queryFn: () => fetchFeed({ data: { windowHours: 6, limit: 5 } }),
    staleTime: 60_000,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto-send deep-linked prompt (from Explain buttons, Replay, Timeline).
  useEffect(() => {
    if (autoSent.current) return;
    if (q && q.trim()) {
      autoSent.current = true;
      sendMessage({ text: q.trim() });
    }
  }, [q, sendMessage]);

  function submit(text?: string) {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="flex flex-col h-screen">
      <header
        className="px-6 md:px-10 py-5 border-b border-[rgba(34,211,238,0.12)] flex items-center justify-between"
        style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.55), transparent)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
            style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.28)" }}
          >
            <Radar className="h-4 w-4" style={{ color: "#22d3ee" }} />
          </span>
          <div>
            <div
              style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}
            >
              AEGIS · COPILOT
            </div>
            <div style={{ fontFamily: SERIF, fontSize: "1.35rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>
              Ask <em style={{ color: "#22d3ee" }}>Aegis</em>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
            style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.7)" }}
          />
          <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
            Grounded · Monad live state
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 md:px-10 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#f5f7fa", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  What are we reading <em style={{ color: "#22d3ee" }}>on Monad</em> today?
                </h2>
                <p className="mt-3 text-sm" style={{ color: "rgba(245,247,250,0.65)" }}>
                  Every answer is grounded in the live Monad market state — token prices, narrative rotation, whale flows.
                  No advice, no invented numbers.
                </p>
              </div>

              {feed && feed.events.length > 0 && (
                <div
                  className="p-4 rounded-[8px]"
                  style={{
                    background: "linear-gradient(180deg, rgba(10,18,28,0.55), rgba(4,10,16,0.55))",
                    border: "1px solid rgba(34,211,238,0.14)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.8)" }}>
                      Evidence rail · grounded on {feed.events.length} live events
                    </span>
                    <LinkIcon className="h-3 w-3" style={{ color: "rgba(34,211,238,0.6)" }} />
                  </div>
                  <div className="space-y-2">
                    {feed.events.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => submit(`Explain event ${e.id}: ${e.headline}. Why does it matter and what should I watch next?`)}
                        className="w-full text-left flex items-start gap-3 px-3 py-2 rounded-[6px] transition-colors hover:bg-[rgba(34,211,238,0.06)]"
                      >
                        <span
                          className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full"
                          style={{ background: "#22d3ee", boxShadow: "0 0 8px rgba(34,211,238,0.6)" }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm truncate" style={{ color: "#f5f7fa" }}>{e.headline}</div>
                          <div className="mt-0.5 flex items-center gap-2" style={{ fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}>
                            <span>{e.minutesAgo}m ago</span>
                            <span>·</span>
                            <span>imp {e.importance}</span>
                            <span>·</span>
                            <span>conf {e.confidence}</span>
                            {e.asset && (<><span>·</span><span style={{ color: "rgba(34,211,238,0.7)" }}>{e.asset.symbol}</span></>)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-2.5">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => submit(s.prompt)}
                    className="group relative text-left p-4 rounded-[8px] transition-all hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(180deg, rgba(10,18,28,0.6), rgba(4,10,16,0.6))",
                      border: "1px solid rgba(34,211,238,0.14)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <s.icon className="h-4 w-4 mt-0.5" style={{ color: "#22d3ee" }} strokeWidth={1.75} />
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>
                          {s.label}
                        </div>
                        <div className="mt-1 text-sm" style={{ color: "rgba(245,247,250,0.9)" }}>{s.prompt}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageRow key={m.id} m={m} />
          ))}

          {busy && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.7)" }}>
              <Loader2 className="h-3 w-3 animate-spin" /> Aegis is reasoning…
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[rgba(34,211,238,0.12)] px-6 md:px-10 py-4" style={{ background: "linear-gradient(180deg, transparent, rgba(4,10,16,0.6))" }}>
        <div className="mx-auto max-w-3xl">
          <div
            className="relative rounded-[10px]"
            style={{
              background: "linear-gradient(180deg, rgba(10,18,28,0.85), rgba(4,10,16,0.85))",
              border: "1px solid rgba(34,211,238,0.22)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 3px rgba(34,211,238,0.05)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              placeholder="Ask about Monad tokens, narratives, whales, opportunities…"
              rows={2}
              className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm outline-none placeholder:text-muted-foreground/60"
              style={{ color: "#f5f7fa", fontFamily: "var(--font-sans)" }}
            />
            <button
              onClick={() => submit()}
              disabled={busy || !input.trim()}
              className="absolute right-2 bottom-2 h-9 w-9 rounded-[6px] inline-flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cta-cyan hover:scale-105"
              aria-label="Send"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.5} />}
            </button>
          </div>
          <div className="mt-2 text-center" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.4)" }}>
            Not financial advice · Grounded in live Monad on-chain state
          </div>
        </div>
      </div>
    </div>
  );
}

function transformCitations(text: string) {
  // Convert [E-<id>] evidence tags into stylized markdown links → timeline.
  return text.replace(/\[E-([A-Za-z0-9_-]+)\]/g, (_m, id) => `[\`E-${id}\`](/app/timeline?event=${id})`);
}

function MessageRow({ m }: { m: UIMessage }) {
  const raw = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const text = transformCitations(raw);
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] px-4 py-2.5 text-sm"
          style={{
            background: "rgba(34,211,238,0.10)",
            border: "1px solid rgba(34,211,238,0.28)",
            borderRadius: "12px 12px 2px 12px",
            color: "#f5f7fa",
          }}
        >
          {raw}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-[6px] mt-0.5"
        style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.3)" }}
      >
        <Radar className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
      </span>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.75)" }}>
          AEGIS
        </div>
        <div className="mt-1 markdown-body text-sm" style={{ color: "rgba(245,247,250,0.92)" }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}