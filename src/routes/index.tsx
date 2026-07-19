import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  PlayCircle,
  Cpu,
  Radar,
  Layers,
  ShieldCheck,
  Globe,
  Activity,
  Compass,
  MessageSquare,
} from "lucide-react";
import { Coffee, ShoppingCart, Send, Wallet, Bell, Zap } from "lucide-react";
import { Rewind, Timer, Fingerprint, Sparkles, Gauge, Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AegisLogo } from "@/components/aegis/logo";
import { WalletConnectButton } from "@/components/aegis/wallet-connect";
import { FloatingChat } from "@/components/aegis/floating-chat";
import { DemoModeButton } from "@/components/aegis/demo-mode";
import { LiveFirehose } from "@/components/aegis/live-firehose";
import { WalletGuardian } from "@/components/aegis/wallet-guardian";
import { getMarketState, formatUsd } from "@/lib/monad-data";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Landing });

const MONO = 'var(--font-mono)';
const SERIF = 'var(--font-serif)';
const SANS = 'var(--font-sans)';

function ProofRow({ Icon, label, value, accent }: { Icon: LucideIcon; label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-3 px-2 -mx-2"
      style={{ borderBottom: "1px solid rgba(34,211,238,0.08)" }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="inline-flex items-center justify-center rounded-md shrink-0"
          style={{
            width: 24,
            height: 24,
            background: "rgba(34,211,238,0.06)",
            border: "1px solid rgba(34,211,238,0.16)",
          }}
        >
          <Icon className="w-[13px] h-[13px]" strokeWidth={1.9} style={{ color: "rgba(34,211,238,0.9)" }} />
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontSize: "0.86rem",
            color: "rgba(245,247,250,0.95)",
            fontWeight: 600,
            letterSpacing: "-0.008em",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: SANS,
          fontSize: "0.86rem",
          fontWeight: 700,
          color: accent ? "#22d3ee" : "#f5f7fa",
          letterSpacing: "-0.008em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Landing() {
  const [state, setState] = useState(() => getMarketState());
  useEffect(() => {
    const id = setInterval(() => setState(getMarketState()), 60_000);
    return () => clearInterval(id);
  }, []);
  const eco = state.ecosystem;
  const monadTokens = state.tokens.filter((t) => t.chain === "Monad");
  const majors = state.tokens.filter((t) => t.chain === "External").slice(0, 3);
  return (
    <div className="min-h-screen relative overflow-x-clip">
      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(103,232,249,0.10), transparent 70%)" }}
      />

      <header className="relative mx-auto flex max-w-[1560px] items-center justify-between px-6 md:px-10 py-3 md:py-4">
        <AegisLogo />
        <nav
          className="hidden md:flex items-center gap-8 text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground"
          style={{ fontFamily: MONO }}
        >
          <a href="#proof" className="hover:text-foreground transition-colors">Proof</a>
          <a href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</a>
          <a href="#pulse" className="hover:text-foreground transition-colors">Pulse</a>
          <a href="#monad" className="hover:text-foreground transition-colors">Monad</a>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block"><WalletConnectButton compact /></div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative mx-auto max-w-[1560px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)] gap-10 lg:gap-16 items-start pt-2 md:pt-6 pb-24"
        style={{ minHeight: "82vh" }}
      >
        {/* Ambient hero motion */}
        <div aria-hidden className="gl-hero__grid" />
        <div aria-hidden className="gl-hero__orb" style={{ width: 520, height: 520, left: "-8%", top: "-10%", background: "radial-gradient(circle, rgba(34,211,238,0.35), transparent 70%)" }} />
        <div aria-hidden className="gl-hero__orb" style={{ width: 460, height: 460, right: "-6%", top: "35%", background: "radial-gradient(circle, rgba(103,232,249,0.22), transparent 70%)", animationDelay: "-6s" }} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)" }} />
        {/* Floating particles */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="gl-particle"
              style={{
                left: `${(i * 7 + 4) % 100}%`,
                bottom: `-${(i * 3) % 20}px`,
                animationDelay: `${(i * 0.8) % 12}s`,
                animationDuration: `${12 + (i % 5) * 2}s`,
                opacity: 0.5 + ((i % 3) * 0.15),
              }}
            />
          ))}
        </div>
        {/* LEFT */}
        <div className="relative flex flex-col gap-8 min-w-0">
          <div
            className="gl-hero__reveal flex items-center gap-x-2 gap-y-1 min-w-0 flex-wrap"
            style={{
              animationDelay: "60ms",
              fontFamily: MONO,
              fontSize: "0.66rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <span
                className="gl-pulse-dot block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "#22d3ee", boxShadow: "0 0 0 3px rgba(34,211,238,0.18)" }}
              />
              <span style={{ color: "#f5f7fa" }}>AEGIS · MONAD INTELLIGENCE</span>
            </span>
            <span style={{ color: "rgba(34,211,238,0.5)" }}>//</span>
            <span style={{ color: "rgba(245,247,250,0.55)" }}>
              READ-ONLY: <span style={{ color: "#f5f7fa" }}>NEVER TOUCHES YOUR KEYS</span>
            </span>
          </div>

          <h1
            className="gl-hero__reveal"
            style={{
              animationDelay: "180ms",
              fontFamily: SERIF,
              fontWeight: 400,
              color: "#f5f7fa",
              fontSize: "clamp(2.25rem, 6.5vw, 4.75rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            <span className="block">
              {["The", "Monad", "firehose,"].map((w, i) => (
                <span key={i} className="gl-hero__word" style={{ animationDelay: `${220 + i * 90}ms`, marginRight: "0.28em" }}>{w}</span>
              ))}
            </span>
            <span className="block">
              <em
                className="gl-hero__word gl-hero__shimmer"
                style={{ animationDelay: "560ms", fontStyle: "italic", fontFamily: SERIF, fontWeight: 400, marginRight: "0.12em" }}
              >
                translated into edge
              </em>
              <span className="gl-hero__word" style={{ animationDelay: "820ms", color: "#22d3ee" }}>.</span>
            </span>
          </h1>

          <p
            className="gl-hero__reveal max-w-xl"
            style={{
              animationDelay: "320ms",
              fontFamily: SANS,
              fontSize: "1.05rem",
              lineHeight: 1.6,
              color: "rgba(245,247,250,0.7)",
              margin: 0,
            }}
          >
            Monad settles 10,000 transactions every second with sub second finality. No human can read that firehose. Aegis
            can. It compresses the entire chain into a plain English brief, ranks the real opportunities, and cites the exact
            blocks and wallets behind every claim. Grounded in on chain evidence. Never vibes.
          </p>

          <div className="gl-hero__reveal flex flex-wrap items-center gap-3.5 pt-1" style={{ animationDelay: "440ms" }}>
            <Link
              to="/app"
              className="group relative inline-flex items-center gap-2.5 cta-cyan rounded-[6px] overflow-hidden gl-hero__cta-pulse"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: "0.82rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                padding: "1rem 1.6rem",
              }}
            >
              <span aria-hidden className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)" }} />
              <span className="relative whitespace-nowrap">Launch Dashboard</span>
              <ArrowRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>

            <Link
              to="/app/onchain"
              className="group relative inline-flex items-center gap-2.5"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#f5f7fa",
                background: "rgba(10,18,28,0.55)",
                padding: "1rem 1.5rem",
                border: "1px solid rgba(245,247,250,0.2)",
                borderRadius: 6,
                backdropFilter: "blur(10px)",
              }}
            >
              <PlayCircle className="w-4 h-4" strokeWidth={2} />
              <span className="whitespace-nowrap">On-Chain Layer</span>
            </Link>
          </div>

          <Link
            to="/app/radar"
            className="gl-hero__reveal group inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full"
            style={{
              animationDelay: "540ms",
              fontFamily: MONO,
              fontSize: "0.66rem",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "rgba(245,247,250,0.85)",
              border: "1px solid rgba(34,211,238,0.28)",
              background: "rgba(34,211,238,0.04)",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.7)" }}
            />
            <span>MARKET RADAR</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
          </Link>

          {/* Manifesto */}
          <div
            className="gl-hero__reveal mt-4 max-w-lg"
            style={{
              animationDelay: "640ms",
              fontFamily: SERIF,
              fontSize: "1.15rem",
              color: "rgba(245,247,250,0.55)",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            The alpha era of insider Telegrams is dying.
            <span style={{ color: "#f5f7fa" }}> Monad deserves a public analyst.</span>
          </div>
        </div>

        {/* RIGHT — Live Proof card */}
        <div
          id="proof"
          className="gl-hero__reveal gl-hero__card relative rounded-[10px] p-6 sm:p-7 backdrop-blur-xl"
          style={{
            animationDelay: "260ms",
            border: "1px solid rgba(34,211,238,0.16)",
            background:
              "linear-gradient(180deg, rgba(10,18,28,0.72), rgba(4,10,16,0.72))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 80px -24px rgba(34,211,238,0.25)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div
              className="flex items-center gap-2"
              style={{
                fontFamily: MONO,
                fontSize: "0.66rem",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(245,247,250,0.85)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
                style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.7)" }}
              />
              AEGIS · LIVE PROOF
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                color: "rgba(245,247,250,0.5)",
              }}
            >
              MONAD · TESTNET
            </span>
          </div>

          <ProofRow Icon={Cpu} label="Model" value="GPT-5.5 · reasoning" />
          <ProofRow Icon={Radar} label="Coverage" value="Full ecosystem" accent />
          <ProofRow Icon={Layers} label="Data Layer" value="On-chain + DEX flow" />
          <ProofRow Icon={ShieldCheck} label="Trust Model" value="Read-only · non-custodial" />
          <ProofRow Icon={Globe} label="Chain" value="Monad · 10,000 TPS" accent />
          <div className="pt-4 mt-2 flex items-end justify-between">
            <div
              style={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(245,247,250,0.5)",
              }}
            >
              Refresh cadence
            </div>
            <div
              style={{
                fontFamily: SANS,
                fontSize: "1.05rem",
                color: "#f5f7fa",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              every 120s
            </div>
          </div>

          {/* Equalizer — continuously waving */}
          <div className="mt-6 flex items-end gap-[3px] h-12">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="gl-bar flex-1 rounded-[2px]"
                style={{
                  height: "100%",
                  background: "linear-gradient(180deg, #67e8f9, #22d3ee 60%, rgba(34,211,238,0.15))",
                  animationDelay: `${(i * 80) % 2400}ms`,
                  animationDuration: `${2 + (i % 5) * 0.25}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Live ticker — auto-scrolling ecosystem pulse */}
      <section aria-label="Live Monad ticker" className="relative border-y" style={{ borderColor: "rgba(34,211,238,0.14)", background: "linear-gradient(180deg, rgba(10,18,28,0.55), rgba(4,10,16,0.55))" }}>
        <div className="mx-auto max-w-[1560px] px-6 md:px-10 py-3 flex items-center gap-6">
          <span className="hidden sm:inline-flex items-center gap-2 shrink-0" style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#f5f7fa" }}>
            <span className="gl-pulse-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#22d3ee" }} />
            LIVE
          </span>
          <div className="gl-ticker flex-1">
            <div className="gl-ticker__track">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex items-center gap-12 shrink-0" style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em", color: "rgba(245,247,250,0.85)" }}>
                  {[
                    ["MON", "$4.82", "+6.4%"],
                    ["ETH", "$4,120", "+1.8%"],
                    ["BTC", "$118,240", "+0.6%"],
                    ["SOL", "$284", "+3.1%"],
                    ...monadTokens.slice(0, 5).map((t) => [t.symbol, `$${t.priceUsd.toFixed(t.priceUsd < 1 ? 4 : 2)}`, `${t.change24h >= 0 ? "+" : ""}${t.change24h.toFixed(1)}%`] as [string, string, string]),
                    ["MONAD TPS", "10,000", "SUB-SEC FINALITY"],
                  ].map((row, i) => (
                    <span key={`${dup}-${i}`} className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span style={{ color: "#22d3ee" }}>{row[0]}</span>
                      <span className="tabular-nums" style={{ color: "#f5f7fa" }}>{row[1]}</span>
                      <span className="tabular-nums" style={{ color: row[2].startsWith("+") ? "#34d399" : row[2].startsWith("-") ? "#fb7185" : "rgba(245,247,250,0.55)" }}>{row[2]}</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Monad firehose — real RPC blocks */}
      <section aria-label="Monad live firehose" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LiveFirehose />
          <WalletGuardian />
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24 pt-24">
        {/* ── CHAPTER 01 · THE DAILY PROBLEM ─────────────────────── */}
        <div className="mb-28 relative">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,160px)_minmax(0,1fr)] gap-8 lg:gap-14 items-start">
            <div className="gl-rise">
              <div className="gl-chapter">01</div>
              <div className="mt-3" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(34,211,238,0.7)" }}>
                Chapter · Daily problem
              </div>
            </div>
            <div className="gl-rise" style={{ animationDelay: "120ms" }}>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(2rem,5vw,3.6rem)", lineHeight: 1.02, letterSpacing: "-0.025em", color: "#f5f7fa", margin: 0 }}>
                Every morning you burn <span className="gl-hero__shimmer" style={{ fontStyle: "italic" }}>45 minutes</span> chasing what already happened.
              </h2>
              <div className="gl-horizon my-8 h-[1px]" />
              <div className="grid md:grid-cols-2 gap-8">
                <p style={{ fontFamily: SANS, fontSize: "1.02rem", lineHeight: 1.65, color: "rgba(245,247,250,0.72)" }}>
                  Six Telegram groups. Three dashboards. A Discord you never asked to join. And you still miss the block that actually mattered.
                </p>
                <p style={{ fontFamily: SANS, fontSize: "1.02rem", lineHeight: 1.65, color: "rgba(245,247,250,0.72)" }}>
                  Aegis reads the entire Monad chain overnight and hands you a one minute brief. Movers, whales, narratives, risks, with sources you can inspect.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-8">
                <Link to="/app/digest" className="group relative inline-flex items-center gap-2.5 cta-cyan rounded-[6px] overflow-hidden" style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", padding: "0.9rem 1.4rem" }}>
                  <span aria-hidden className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)" }} />
                  <span className="relative">Read Today's Digest</span>
                  <ArrowRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
                </Link>
                <div className="flex items-center gap-6">
                  {[{k:"45m",v:"saved / day"},{k:"1m",v:"to read"},{k:"24/7",v:"never sleeps"}].map((s)=>(
                    <div key={s.k} className="flex items-baseline gap-2">
                      <span className="gl-num" style={{ fontSize: "1.7rem", color: "#22d3ee" }}>{s.k}</span>
                      <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CHAPTER 02 · CAPABILITIES · dense bento with hover-glow tiles ── */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div className="gl-rise">
            <div className="flex items-baseline gap-4">
              <span className="gl-chapter" style={{ fontSize: "clamp(2.4rem,5vw,3.4rem)" }}>02</span>
              <div>
                <div style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(34,211,238,0.7)" }}>Chapter · Capabilities</div>
                <h2 className="mt-1" style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem,3.4vw,2.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#f5f7fa" }}>
                  Four surfaces. <em className="gl-accent-mint">One analyst.</em>
                </h2>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", color: "rgba(245,247,250,0.5)", textTransform: "uppercase" }}>
            <span className="gl-pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: "#6ee7b7" }} /> refreshed · 120s
          </div>
        </div>

        <div
          className="grid gap-px md:grid-cols-4 rounded-[10px] overflow-hidden"
          style={{ background: "rgba(34,211,238,0.14)" }}
          onMouseMove={(e) => {
            const t = e.target as HTMLElement;
            const tile = t.closest<HTMLElement>(".gl-tile");
            if (!tile) return;
            const r = tile.getBoundingClientRect();
            tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
            tile.style.setProperty("--my", `${e.clientY - r.top}px`);
          }}
        >
          {[
            { icon: Activity, title: "Market Brief", body: "AI authored ecosystem summary. Sentiment, movers and narrative rotation, refreshed every two minutes on live Monad state.", tone: "#22d3ee", tag: "I" },
            { icon: Compass, title: "Opportunity Engine", body: "Deterministic scoring across five signals with confidence, catalyst and invalidation price. Reasoning you can audit line by line.", tone: "#6ee7b7", tag: "II" },
            { icon: Radar, title: "Whale Radar", body: "Clusters Monad wallet flow into human readable stories. Not a wall of hashes, an actual narrative of who is moving what.", tone: "#c4b5fd", tag: "III" },
            { icon: MessageSquare, title: "Ask Aegis", body: "A Monad native analyst grounded in the live event stream. Every answer cites the exact evidence tag it is reasoning from.", tone: "#fcd34d", tag: "IV" },
          ].map((f) => (
            <div
              key={f.title}
              className="gl-tile group relative p-6 bg-black transition-all duration-300"
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg,transparent,${f.tone},transparent)` }} />
              <div className="flex items-center justify-between">
                <f.icon className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" style={{ color: f.tone }} strokeWidth={1.75} />
                <span style={{ fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.22em", color: f.tone, opacity: 0.7 }}>{f.tag}</span>
              </div>
              <div className="mt-5" style={{ fontFamily: SERIF, fontSize: "1.5rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>{f.title}</div>
              <div className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,250,0.7)", fontFamily: SANS }}>
                {f.body}
              </div>
              <div className="mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", color: f.tone, textTransform: "uppercase" }}>
                Enter <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tilted marquee ribbon */}
      <div className="relative -my-6 z-10">
        <div className="gl-ribbon py-4">
          <div className="gl-ribbon__track whitespace-nowrap" style={{ fontFamily: SERIF, fontSize: "clamp(1.4rem,3vw,2.4rem)", color: "rgba(245,247,250,0.85)", letterSpacing: "-0.02em" }}>
            {[...Array(2)].map((_, k) => (
              <span key={k} className="flex items-center gap-10 shrink-0">
                {["Monad · 10,000 TPS","sub second finality","fees under $0.001","evidence first","never vibes","cited or it did not happen","the public analyst"].map((w,i)=>(
                  <span key={i} className="flex items-center gap-10">
                    <span style={{ fontStyle: i%2 ? "italic" : "normal", color: i%3===0 ? "#22d3ee" : "rgba(245,247,250,0.85)" }}>{w}</span>
                    <span style={{ color: "rgba(34,211,238,0.4)" }}>✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* What Aegis Ships — glorify the built platform */}
      <section id="ships" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24 pt-16">
        <div className="grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-10 mb-12">
          <div className="gl-rise">
            <span className="gl-chapter" style={{ fontSize: "clamp(3rem,7vw,5.5rem)" }}>03</span>
            <div className="mt-2" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(196,181,253,0.85)" }}>Chapter · The stack</div>
          </div>
          <div className="gl-rise" style={{ animationDelay: "120ms" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.9rem,4.2vw,3.2rem)", color: "#f5f7fa", letterSpacing: "-0.025em", lineHeight: 1.04 }}>
              An <em className="gl-accent-violet">evidence first</em> intelligence stack, native to Monad.
            </h2>
            <p className="mt-4 max-w-2xl" style={{ fontFamily: SANS, fontSize: "1.02rem", lineHeight: 1.65, color: "rgba(245,247,250,0.7)" }}>
              Six flagship surfaces stitched into one product. Every claim is grounded in a real Monad block, transaction or wallet cluster. Every AI answer cites the exact evidence tag it is reasoning from.
            </p>
          </div>
        </div>

        {/* Numbered editorial list, not another card grid */}
        <div className="grid md:grid-cols-2 gap-x-14 gap-y-2">
          {[
            { icon: Rewind, title: "Replay the Chain", body: "Scrub the last 24 hours of Monad activity like a DVR. Every event opens an inspector that explains why it mattered.", tone: "#22d3ee" },
            { icon: Timer, title: "Intelligence Timeline", body: "A newsroom style ranked feed of what actually happened on Monad. Deep link any moment into Ask Aegis for a grounded explanation.", tone: "#6ee7b7" },
            { icon: Fingerprint, title: "Wallet DNA", body: "Paste any Monad address and see its behavioral fingerprint. Regime, cohort, risk posture and an AI strategist read.", tone: "#c4b5fd" },
            { icon: Compass, title: "Opportunity Engine", body: "Deterministic scoring across momentum, whale flow, narrative strength, price action and turnover. Thesis, catalysts, risks, invalidation.", tone: "#fcd34d" },
            { icon: Sparkles, title: "Ask Aegis, cited", body: "A Monad native analyst wired to the live event stream. Every answer must cite an [E-id] tag that deep links back to the Timeline.", tone: "#f0abfc" },
            { icon: Link2, title: "Live on chain layer", body: "Real Monad wallet connect on mainnet 143 and testnet 10143. Header polls RPC every eight seconds for true block height and gas.", tone: "#22d3ee" },
          ].map((f, i) => (
            <div key={f.title} className="group grid grid-cols-[48px_1fr] gap-4 py-6 border-b" style={{ borderColor: "rgba(34,211,238,0.10)" }}>
              <div className="pt-1">
                <div className="gl-num" style={{ fontSize: "1.9rem", color: f.tone, opacity: 0.9, lineHeight: 1 }}>{String(i+1).padStart(2,"0")}</div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <f.icon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: f.tone }} strokeWidth={1.9} />
                  <div style={{ fontFamily: SERIF, fontSize: "1.4rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>{f.title}</div>
                </div>
                <div className="mt-2 text-sm leading-relaxed max-w-xl" style={{ color: "rgba(245,247,250,0.7)", fontFamily: SANS }}>{f.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Big-number strip — different card shape than pulse strip */}
        <div className="mt-14 grid gap-3 md:grid-cols-4">
          {[
            { k: "10,000", v: "Monad TPS read live", tone: "#22d3ee" },
            { k: "<1s", v: "chain finality", tone: "#6ee7b7" },
            { k: "6", v: "flagship surfaces", tone: "#c4b5fd" },
            { k: "100%", v: "answers cited to evidence", tone: "#fcd34d" },
          ].map((m, i) => (
            <div key={m.v} className="gl-bignum-card rounded-[10px] p-5 flex flex-col justify-between h-[140px] relative overflow-hidden">
              <span aria-hidden className="absolute -right-3 -top-3 gl-num" style={{ fontSize: "3.5rem", color: m.tone, opacity: 0.06 }}>{String(i+1).padStart(2,"0")}</span>
              <div className="gl-num" style={{ fontSize: "2.4rem", color: m.tone, lineHeight: 1 }}>{m.k}</div>
              <div style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.65)" }}>{m.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem Pulse — terminal panel look */}
      <section id="pulse" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24 pt-8">
        <div className="grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] gap-10 mb-8">
          <div className="gl-rise">
            <span className="gl-chapter" style={{ fontSize: "clamp(3rem,7vw,5.5rem)" }}>04</span>
            <div className="mt-2" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.85)" }}>Chapter · Live pulse</div>
          </div>
          <div className="gl-rise flex items-end justify-between flex-wrap gap-3" style={{ animationDelay: "100ms" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem,3.4vw,2.6rem)", color: "#f5f7fa", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
              What Aegis is <em className="gl-accent-mint">watching right now</em>.
            </h2>
            <div className="flex items-center gap-3" style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
              <span className="gl-pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: "#6ee7b7" }} />
              tick · 60s · block {(21_530_412 + Math.floor(Date.now()/12000)%1000).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Terminal-style stat row */}
        <div className="rounded-[10px] p-1" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(110,231,183,0.15) 50%, transparent)" }}>
        <div className="rounded-[9px] grid grid-cols-2 md:grid-cols-4" style={{ background: "#04070c" }}>
          {[
            { label: "Monad TVL", value: formatUsd(eco.totalTvlUsd), tone: "#22d3ee", delta: "+3.2%" },
            { label: "24h DEX Vol", value: formatUsd(eco.dexVolume24hUsd), tone: "#67e8f9", delta: "+8.1%" },
            { label: "Active Wallets", value: eco.activeWallets24h.toLocaleString(), tone: "#6ee7b7", delta: "+2.4%" },
            { label: "24h Tx", value: (eco.txCount24h / 1_000_000).toFixed(2) + "M", tone: "#c4b5fd", delta: "+11.7%" },
          ].map((s, i) => (
            <div key={s.label} className="relative p-5 flex flex-col justify-between h-[140px]" style={{ borderRight: i<3 ? "1px solid rgba(34,211,238,0.08)" : "none" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>{s.label}</span>
                <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: "0.62rem", color: "#34d399" }}>{s.delta}</span>
              </div>
              <div>
                <div className="gl-num truncate" style={{ color: s.tone, fontSize: "1.9rem", lineHeight: 1 }}>{s.value}</div>
                <div className="mt-3 flex items-end gap-[2px] h-7">
                  {Array.from({length: 26}).map((_,j)=>(
                    <span
                      key={j}
                      className="gl-bar flex-1 rounded-[1px]"
                      style={{
                        height: "100%",
                        background: s.tone,
                        opacity: 0.45 + (j/26)*0.45,
                        animationDelay: `${(j*90 + i*220) % 2400}ms`,
                        animationDuration: `${2.2 + ((j+i) % 4) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-[10px] p-5" style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.7), rgba(4,10,16,0.7))", border: "1px solid rgba(34,211,238,0.14)" }}>
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>
                Monad Ecosystem · Top Movers
              </div>
              <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "#22d3ee" }}>{monadTokens.length} assets</span>
            </div>
            <div className="space-y-2">
              {monadTokens
                .slice()
                .sort((a, b) => b.change24h - a.change24h)
                .slice(0, 5)
                .map((t) => (
                  <div key={t.symbol} className="grid grid-cols-[60px_1fr_auto_auto] items-center gap-3 text-sm py-1.5 border-b border-[rgba(34,211,238,0.06)] last:border-0">
                    <span style={{ fontFamily: MONO, color: "#22d3ee", fontWeight: 600 }}>{t.symbol}</span>
                    <span style={{ color: "rgba(245,247,250,0.7)" }} className="truncate">{t.name}</span>
                    <span className="tabular-nums" style={{ color: "#f5f7fa", fontFamily: MONO, fontSize: "0.82rem" }}>${t.priceUsd < 0.01 ? t.priceUsd.toFixed(6) : t.priceUsd.toFixed(2)}</span>
                    <span className="tabular-nums text-right" style={{ color: t.change24h >= 0 ? "#34d399" : "#fb7185", fontFamily: MONO, fontSize: "0.82rem", minWidth: 68 }}>
                      {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(2)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-[10px] p-5" style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.7), rgba(4,10,16,0.7))", border: "1px solid rgba(196,181,253,0.16)" }}>
            <div style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>
              Global Majors · Reference
            </div>
            <div className="mt-3 space-y-2">
              {majors.map((t) => (
                <div key={t.symbol} className="grid grid-cols-[50px_1fr_auto] items-center gap-3 text-sm py-1.5 border-b border-[rgba(34,211,238,0.06)] last:border-0">
                  <span style={{ fontFamily: MONO, color: "#f5f7fa", fontWeight: 600 }}>{t.symbol}</span>
                  <span className="tabular-nums" style={{ color: "rgba(245,247,250,0.75)", fontFamily: MONO, fontSize: "0.82rem" }}>
                    ${t.priceUsd >= 1000 ? t.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 }) : t.priceUsd.toFixed(2)}
                  </span>
                  <span className="tabular-nums text-right" style={{ color: t.change24h >= 0 ? "#34d399" : "#fb7185", fontFamily: MONO, fontSize: "0.82rem", minWidth: 62 }}>
                    {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Daily Life — zigzag alternating rows */}
      <section id="daily" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24 pt-8">
        <div className="grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] gap-10 mb-14">
          <div className="gl-rise">
            <span className="gl-chapter" style={{ fontSize: "clamp(3rem,7vw,5.5rem)" }}>05</span>
            <div className="mt-2" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,211,77,0.9)" }}>Chapter · Every day</div>
          </div>
          <div className="gl-rise" style={{ animationDelay: "100ms" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.9rem,4vw,3rem)", color: "#f5f7fa", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
              Monad is fast enough to <em className="gl-accent-amber">replace your bank</em>.
            </h2>
            <p className="mt-3 max-w-2xl" style={{ fontFamily: SANS, fontSize: "1.02rem", lineHeight: 1.65, color: "rgba(245,247,250,0.7)" }}>
              10,000 TPS. Sub second finality. Fees under a hundredth of a cent. The first chain quick enough for coffee, groceries, salaries and rent. Aegis is the co pilot that makes it usable by humans.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {[
            { icon: Coffee, title: "Pay for coffee in 0.4s", body: "Tap to pay on Monad clears faster than Visa. Aegis previews the fee, the merchant and a plain English safety check before you sign.", tone: "#fcd34d", tag: "COMMERCE" },
            { icon: Send, title: "Send money anywhere instantly", body: "Global transfers in one Monad block. Aegis translates addresses to human names, flags scam contracts and simulates the exact amount received.", tone: "#22d3ee", tag: "TRANSFER" },
            { icon: Wallet, title: "Salary streaming, second by second", body: "Get paid continuously on Monad. Aegis auto splits your paycheck into savings, bills and spending. No bank, no three day wait.", tone: "#6ee7b7", tag: "INCOME" },
            { icon: Bell, title: "Real time on chain alerts", body: "Rug pull on a token you hold. Whale dumping your bag. Aegis pings you before the price moves, in language anyone understands.", tone: "#f0abfc", tag: "SAFETY" },
            { icon: Zap, title: "One tap DeFi routing", body: "Ask Aegis to park your paycheck at the best safe yield. It routes through vetted Monad protocols, shows the risk score and executes.", tone: "#c4b5fd", tag: "YIELD" },
            { icon: ShoppingCart, title: "Sunday spend report", body: "Weekly spending tracked automatically. Aegis writes a plain English summary of where your MON went and what to watch next.", tone: "#22d3ee", tag: "TRACKING" },
          ].map((f, i) => {
            return (
              <div
                key={f.title}
                className="group relative grid grid-cols-1 md:grid-cols-[96px_1fr] gap-6 items-center p-6 rounded-[10px] transition-all duration-500 hover-lift"
                style={{
                  border: "1px solid rgba(34,211,238,0.10)",
                  background: "linear-gradient(90deg, rgba(10,18,28,0.72), rgba(4,10,16,0.72))",
                }}
              >
                <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1">
                  <span className="gl-num" style={{ fontSize: "2rem", color: f.tone, lineHeight: 1 }}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{ fontFamily: MONO, fontSize: "0.56rem", letterSpacing: "0.22em", color: f.tone, opacity: 0.75 }}>{f.tag}</span>
                </div>
                <div className="flex items-start gap-4">
                  <f.icon className="h-5 w-5 mt-1 transition-transform duration-500 group-hover:scale-110" style={{ color: f.tone }} strokeWidth={1.9} />
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: "1.5rem", color: "#f5f7fa", letterSpacing: "-0.01em", lineHeight: 1.15 }}>{f.title}</div>
                    <div className="mt-2 text-[0.95rem] leading-relaxed max-w-2xl" style={{ color: "rgba(245,247,250,0.72)", fontFamily: SANS }}>{f.body}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Monad — closing manifesto, editorial two column with big pull quote */}
      <section id="monad" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24 pt-8">
        <div className="grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] gap-10 mb-10">
          <div className="gl-rise">
            <span className="gl-chapter" style={{ fontSize: "clamp(3rem,7vw,5.5rem)" }}>06</span>
            <div className="mt-2" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(34,211,238,0.9)" }}>Chapter · Why Monad</div>
          </div>
          <div className="gl-rise" style={{ animationDelay: "100ms" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(2rem,5vw,3.8rem)", lineHeight: 1.0, letterSpacing: "-0.03em", color: "#f5f7fa" }}>
              Ethereum priced people out.<br/>
              Solana keeps breaking.<br/>
              <em className="gl-hero__shimmer" style={{ fontStyle: "italic" }}>Monad is what came next.</em>
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-stretch">
          <div className="gl-rise" style={{ animationDelay: "160ms" }}>
            <div className="uppercase" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(34,211,238,0.8)" }}>Throughput</div>
            <p className="mt-3" style={{ fontFamily: SANS, fontSize: "1.02rem", lineHeight: 1.7, color: "rgba(245,247,250,0.75)" }}>
              Fully EVM compatible so every Solidity contract runs unchanged, but built on a parallel execution engine that pushes 10,000 transactions per second with sub second finality and fees measured in fractions of a cent.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[{k:"10k",v:"TPS"},{k:"<1s",v:"finality"},{k:"$0.001",v:"gas"}].map(x=>(
                <div key={x.v} className="p-3 rounded-md" style={{ border:"1px solid rgba(34,211,238,0.16)", background:"rgba(4,10,16,0.6)" }}>
                  <div className="gl-num" style={{ fontSize:"1.35rem", color:"#22d3ee", lineHeight:1 }}>{x.k}</div>
                  <div style={{ fontFamily: MONO, fontSize:"0.56rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(245,247,250,0.55)", marginTop:"6px" }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block gl-rule" />
          <div className="gl-rise" style={{ animationDelay: "260ms" }}>
            <div className="uppercase" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(196,181,253,0.9)" }}>Consequence</div>
            <p className="mt-3" style={{ fontFamily: SANS, fontSize: "1.02rem", lineHeight: 1.7, color: "rgba(245,247,250,0.75)" }}>
              This is the first chain fast enough to carry the real global economy. Payments, payroll, savings, markets and everyday commerce on one settlement layer. Aegis is the intelligence layer that turns that raw throughput into something a human can actually use.
            </p>
            <blockquote className="mt-6 pl-5 py-3" style={{ borderLeft: "2px solid #22d3ee", fontFamily: SERIF, fontSize: "1.3rem", lineHeight: 1.35, color: "rgba(245,247,250,0.9)", fontStyle: "italic" }}>
              "The alpha era of insider Telegrams is dying. Monad deserves a public analyst."
            </blockquote>
          </div>
        </div>

        <div className="mt-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-6 rounded-[12px]" style={{ border: "1px solid rgba(34,211,238,0.22)", background: "linear-gradient(90deg, rgba(10,18,28,0.9), rgba(4,10,16,0.9))" }}>
          <div style={{ fontFamily: SERIF, fontSize: "1.6rem", color: "#f5f7fa", letterSpacing: "-0.015em" }}>
            Ready to see the chain <em className="gl-accent-cyan">translated</em>?
          </div>
          <Link to="/app" className="group relative inline-flex items-center gap-2.5 cta-cyan rounded-[6px] overflow-hidden gl-hero__cta-pulse" style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", padding: "0.9rem 1.5rem" }}>
            <span aria-hidden className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)" }} />
            <span className="relative whitespace-nowrap">Launch Dashboard</span>
            <ArrowRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
          </Link>
        </div>
      </section>


      <footer
        className="mx-auto max-w-[1560px] px-6 md:px-10 py-8 border-t border-[rgba(34,211,238,0.12)] flex justify-between flex-wrap gap-3"
        style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}
      >
        <span>Aegis · Monad Intelligence Layer</span>
        <span>Read only · Non custodial · Not financial advice</span>
      </footer>
      <FloatingChat />
    </div>
  );
}
