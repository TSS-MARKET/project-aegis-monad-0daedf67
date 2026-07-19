// Judge Demo Mode — a 30-second scripted auto-tour that walks through Aegis'
// flagship surfaces (Firehose → Timeline → Replay → Opportunities → Wallet
// DNA → Ask Aegis) with captions. Built for hackathon judging in under a
// minute. Pure client-side; no data needs to be pre-loaded.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Play, X, ChevronRight } from "lucide-react";

type Step = {
  to: string;
  ms: number;
  eyebrow: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    to: "/",
    ms: 4200,
    eyebrow: "01 · The daily problem",
    title: "Traders lose an hour every morning reading Monad by hand.",
    body: "Aegis replaces the morning research routine with one grounded briefing — built on live Monad RPC, not a chatbot guessing.",
  },
  {
    to: "/app",
    ms: 4200,
    eyebrow: "02 · Live Monad state",
    title: "Every panel is anchored to real chain events.",
    body: "Rolling TPS, gas load, whale flow, narrative rotation — one glance, one truth. No dashboards to configure.",
  },
  {
    to: "/app/timeline",
    ms: 4200,
    eyebrow: "03 · Intelligence Timeline",
    title: "Every event has an id you can cite.",
    body: "Ask Aegis footnotes its answers with [E-<id>] tags that link straight back into this timeline. Evidence, not vibes.",
  },
  {
    to: "/app/replay",
    ms: 4200,
    eyebrow: "04 · Replay the Chain",
    title: "Rewind Monad the moment something moves.",
    body: "Scrub any window in the last hour and watch whales, liquidity, and price rebuild block-by-block on Monad's sub-second finality.",
  },
  {
    to: "/app/opportunities",
    ms: 4200,
    eyebrow: "05 · Opportunity Engine",
    title: "Every setup shows its receipts.",
    body: "Deterministic scoring across momentum, turnover, whale flow, and narrative — each opportunity anchored to the three events proving it.",
  },
  {
    to: "/app/wallet",
    ms: 4200,
    eyebrow: "06 · Wallet DNA · Guardian",
    title: "Paste any Monad address, get an on-chain scorecard.",
    body: "Balance, tx count, contract check, gas runway, A–F grade. A daily-life safety net for anyone touching Monad.",
  },
  {
    to: "/app/chat",
    ms: 4600,
    eyebrow: "07 · Ask Aegis",
    title: "A tool-calling agent with live Monad tools.",
    body: "inspectMonadWallet · getMonadFirehose · rankOpportunities · lookupEvent. It reads Monad, it doesn't hallucinate about it.",
  },
];

const TOTAL_MS = STEPS.reduce((a, s) => a + s.ms, 0);

const DEMO_EVENT = "aegis:start-demo";

export function startAegisDemo() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DEMO_EVENT));
}

/**
 * Global mount — put this once in __root so the overlay survives route
 * unmounts. Buttons only dispatch the start event.
 */
export function DemoModeHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(DEMO_EVENT, on);
    return () => window.removeEventListener(DEMO_EVENT, on);
  }, []);
  if (!open) return null;
  if (typeof document === "undefined") return null;
  return createPortal(<DemoOverlay onClose={() => setOpen(false)} />, document.body);
}

export function DemoModeButton({ variant = "floating" }: { variant?: "floating" | "inline" | "premium" }) {
  if (variant === "premium") {
    return (
      <button
        onClick={() => startAegisDemo()}
        className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-[6px] transition-transform duration-300 hover:-translate-y-0.5"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.82rem",
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          padding: "1rem 1.6rem",
          color: "#eafcff",
          background:
            "linear-gradient(180deg, rgba(10,22,32,0.95), rgba(4,12,18,0.95))",
          border: "1px solid rgba(34,211,238,0.5)",
          boxShadow:
            "0 10px 30px -10px rgba(34,211,238,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
        aria-label="Play 30-second judge tour"
      >
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
          style={{ background: "linear-gradient(90deg,transparent,rgba(34,211,238,0.45),transparent)" }}
        />
        <span className="relative inline-flex items-center gap-2.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.8)" }}
          />
          <span className="whitespace-nowrap">30-Second Tour</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={() => startAegisDemo()}
      className={
        variant === "floating"
          ? "fixed bottom-5 left-5 z-40 group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5"
          : "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all hover:-translate-y-0.5"
      }
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: variant === "floating" ? undefined : "0.6rem",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        background: "linear-gradient(180deg, rgba(10,18,28,0.9), rgba(4,10,16,0.9))",
        border: "1px solid rgba(34,211,238,0.3)",
        color: "#22d3ee",
        boxShadow: variant === "floating" ? "0 8px 30px rgba(34,211,238,0.18), inset 0 1px 0 rgba(255,255,255,0.05)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
      aria-label="Play 30-second judge tour"
    >
      <span>30s Tour</span>
      <ChevronRight className={variant === "floating" ? "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" : "h-3 w-3 transition-transform group-hover:translate-x-0.5"} />
    </button>
  );
}

function DemoOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startAt = useRef(Date.now());
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let acc = 0;
    STEPS.forEach((step, i) => {
      timers.push(
        setTimeout(() => {
          if (stopped.current) return;
          setIdx(i);
          navigate({ to: step.to });
        }, acc),
      );
      acc += step.ms;
    });
    timers.push(setTimeout(() => { if (!stopped.current) onClose(); }, acc + 400));
    const tick = setInterval(() => setElapsed(Date.now() - startAt.current), 100);
    return () => {
      stopped.current = true;
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = STEPS[idx];
  const progress = Math.min(1, elapsed / TOTAL_MS);

  return (
    <div
      className="fixed inset-0 z-[80] pointer-events-none"
      aria-live="polite"
    >
      {/* corner vignette so captions read against any page */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 100%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 40%, transparent 70%)",
        }}
      />

      {/* Top progress bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: "rgba(34,211,238,0.08)" }}
      >
        <div
          className="h-full transition-[width] duration-100 ease-linear"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #22d3ee 0%, #7dd3fc 100%)",
            boxShadow: "0 0 12px rgba(34,211,238,0.6)",
          }}
        />
      </div>

      {/* Step dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === idx ? 22 : 8,
              background: i <= idx ? "#22d3ee" : "rgba(255,255,255,0.15)",
              boxShadow: i === idx ? "0 0 8px rgba(34,211,238,0.7)" : "none",
            }}
          />
        ))}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="pointer-events-auto absolute top-4 right-4 h-9 w-9 rounded-full inline-flex items-center justify-center transition-colors hover:bg-white/10"
        style={{
          background: "rgba(4,10,16,0.7)",
          border: "1px solid rgba(34,211,238,0.25)",
          color: "#f5f7fa",
        }}
        aria-label="Exit demo"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Caption card */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(680px,calc(100vw-2rem))] pointer-events-auto">
        <div
          key={idx}
          className="rounded-[12px] p-5 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{
            background: "linear-gradient(180deg, rgba(10,18,28,0.95), rgba(4,10,16,0.95))",
            border: "1px solid rgba(34,211,238,0.35)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[0.6rem]"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#22d3ee",
              }}
            >
              {step.eyebrow}
            </span>
            <span
              className="text-[0.6rem]"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(245,247,250,0.55)",
              }}
            >
              {String(idx + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </span>
          </div>
          <h3
            className="text-xl md:text-2xl leading-snug"
            style={{ fontFamily: "var(--font-serif)", color: "#f5f7fa", letterSpacing: "-0.01em" }}
          >
            {step.title}
          </h3>
          <p className="mt-2 text-sm md:text-[0.95rem]" style={{ color: "rgba(245,247,250,0.72)" }}>
            {step.body}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[0.6rem]"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(245,247,250,0.5)",
              }}
            >
              <Play className="h-3 w-3" style={{ color: "#22d3ee" }} />
              Auto · {Math.max(0, Math.round((TOTAL_MS - elapsed) / 1000))}s left
            </span>
            <button
              onClick={onClose}
              className="text-[0.65rem]"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(245,247,250,0.5)",
              }}
            >
              Skip →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}