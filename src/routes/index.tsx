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
                className="block w-1.5 h-1.5 rounded-full shrink-0"
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

          {/* Equalizer */}
          <div className="mt-6 flex items-end gap-[3px] h-10">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${20 + Math.abs(Math.sin(i * 0.7)) * 80}%`,
                  background: "linear-gradient(180deg, #67e8f9, #22d3ee 60%, rgba(34,211,238,0.2))",
                  animation: `pulse-glow ${1.6 + (i % 5) * 0.2}s ease-in-out ${i * 40}ms infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: "0.66rem",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(245,247,250,0.55)",
              }}
            >
              // CAPABILITIES
            </div>
            <h2
              className="mt-2"
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "#f5f7fa",
              }}
            >
              Four surfaces. <em style={{ color: "#22d3ee" }}>One analyst.</em>
            </h2>
          </div>
        </div>

        <div className="grid gap-px md:grid-cols-4 rounded-[10px] overflow-hidden" style={{ background: "rgba(34,211,238,0.14)" }}>
          {[
            { icon: Activity, title: "Market Brief", body: "AI authored ecosystem summary. Sentiment, movers and narrative rotation, refreshed every two minutes on live Monad state." },
            { icon: Compass, title: "Opportunity Engine", body: "Deterministic scoring across five signals with confidence, catalyst and invalidation price. Reasoning you can audit line by line." },
            { icon: Radar, title: "Whale Radar", body: "Clusters Monad wallet flow into human readable stories. Not a wall of hashes, an actual narrative of who is moving what." },
            { icon: MessageSquare, title: "Ask Aegis", body: "A Monad native analyst grounded in the live event stream. Every answer cites the exact evidence tag it is reasoning from." },
          ].map((f) => (
            <div
              key={f.title}
              className="group relative p-6 bg-black transition-all duration-300 hover:bg-[rgba(34,211,238,0.04)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(90deg,transparent,#22d3ee,transparent)" }}
              />
              <f.icon
                className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                style={{ color: "#22d3ee" }}
                strokeWidth={1.75}
              />
              <div
                className="mt-5"
                style={{ fontFamily: SERIF, fontSize: "1.5rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}
              >
                {f.title}
              </div>
              <div className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,250,0.7)", fontFamily: SANS }}>
                {f.body}
              </div>
              <div
                className="mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", color: "#22d3ee", textTransform: "uppercase" }}
              >
                Enter <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What Aegis Ships — glorify the built platform */}
      <section id="ships" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24">
        <div className="mb-10 max-w-3xl">
          <div style={{ fontFamily: MONO, fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(245,247,250,0.55)" }}>
            // WHAT AEGIS SHIPS
          </div>
          <h2 className="mt-2" style={{ fontFamily: SERIF, fontSize: "clamp(1.75rem,3.5vw,2.75rem)", color: "#f5f7fa", letterSpacing: "-0.02em", lineHeight: 1.08 }}>
            An <em style={{ color: "#22d3ee" }}>evidence first</em> intelligence stack, native to Monad.
          </h2>
          <p className="mt-4" style={{ fontFamily: SANS, fontSize: "1.02rem", lineHeight: 1.65, color: "rgba(245,247,250,0.7)" }}>
            Six flagship surfaces stitched into one product. Every claim is grounded in a real Monad block, transaction or
            wallet cluster. Every AI answer cites the exact evidence tag it is reasoning from. Nothing is generated in the dark.
          </p>
        </div>
        <div className="grid gap-px md:grid-cols-3 rounded-[10px] overflow-hidden" style={{ background: "rgba(34,211,238,0.14)" }}>
          {[
            { icon: Rewind, title: "Replay the Chain", body: "Scrub the last 24 hours of Monad activity like a DVR. Every event opens an inspector that explains why it mattered, with the block, wallets and evidence attached." },
            { icon: Timer, title: "Intelligence Timeline", body: "A newsroom style ranked feed of what actually happened on Monad in the last six hours. Deep link any moment straight into Ask Aegis for a grounded explanation." },
            { icon: Fingerprint, title: "Wallet DNA", body: "Paste any Monad address and see its behavioral fingerprint. Regime, cohort, risk posture and an AI strategist read of how this wallet actually operates." },
            { icon: Compass, title: "Opportunity Engine", body: "Deterministic scoring across momentum, whale flow, narrative strength, price action and turnover. Every setup ships with a thesis, catalysts, risks and an invalidation level." },
            { icon: Sparkles, title: "Ask Aegis, cited", body: "A Monad native analyst wired directly to the live event stream. Every answer must cite an [E-id] evidence tag that deep links back to the Timeline. No hallucinated markets." },
            { icon: Link2, title: "Live on chain layer", body: "Real Monad wallet connect on mainnet 143 and testnet 10143. Header status polls Monad RPC every eight seconds so you always see the true block height and gas price." },
          ].map((f) => (
            <div key={f.title} className="group relative p-6 bg-black transition-all duration-300 hover:bg-[rgba(34,211,238,0.04)] hover-lift">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(90deg,transparent,#22d3ee,transparent)" }} />
              <f.icon className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" style={{ color: "#22d3ee" }} strokeWidth={1.75} />
              <div className="mt-5" style={{ fontFamily: SERIF, fontSize: "1.35rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>{f.title}</div>
              <div className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,250,0.7)", fontFamily: SANS }}>{f.body}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {[
            { k: "10,000", v: "Monad TPS the engine reads live" },
            { k: "<1s", v: "Chain finality Aegis writes against" },
            { k: "6", v: "Flagship intelligence surfaces" },
            { k: "100%", v: "Answers cited to on chain evidence" },
          ].map((m) => (
            <div key={m.v} className="rounded-[10px] p-5 hover-lift flex flex-col justify-between h-[128px]" style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.7), rgba(4,10,16,0.7))", border: "1px solid rgba(34,211,238,0.22)" }}>
              <div className="tabular-nums" style={{ fontFamily: SERIF, fontSize: "2.1rem", color: "#22d3ee", lineHeight: 1, letterSpacing: "-0.02em" }}>{m.k}</div>
              <div style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.65)", lineHeight: 1.35 }}>{m.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem Pulse — live data strip */}
      <section id="pulse" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <div>
            <div style={{ fontFamily: MONO, fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(245,247,250,0.55)" }}>
              // LIVE ECOSYSTEM PULSE
            </div>
            <h2 className="mt-2" style={{ fontFamily: SERIF, fontSize: "clamp(1.5rem,3vw,2.25rem)", color: "#f5f7fa", letterSpacing: "-0.02em" }}>
              What Aegis is <em style={{ color: "#22d3ee" }}>watching right now</em>.
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse-glow" style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.7)" }} />
            <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
              refresh · 60s
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Monad TVL", value: formatUsd(eco.totalTvlUsd), tone: "#22d3ee" },
            { label: "24h DEX Vol", value: formatUsd(eco.dexVolume24hUsd), tone: "#67e8f9" },
            { label: "Active Wallets", value: eco.activeWallets24h.toLocaleString(), tone: "#34d399" },
            { label: "24h Tx Count", value: (eco.txCount24h / 1_000_000).toFixed(2) + "M", tone: "#a78bfa" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[10px] p-4 hover-lift flex flex-col justify-between h-[128px]"
              style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.7), rgba(4,10,16,0.7))", border: "1px solid rgba(34,211,238,0.14)" }}
            >
              <div className="min-h-[1.9em] leading-[1.15]" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>{s.label}</div>
              <div>
                <div className="text-2xl font-bold tabular-nums truncate" style={{ color: s.tone, fontFamily: SANS, letterSpacing: "-0.01em", lineHeight: 1 }}>{s.value}</div>
                <div className="mt-3 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${s.tone}, transparent)` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div
            className="rounded-[10px] p-5 hover-lift"
            style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.7), rgba(4,10,16,0.7))", border: "1px solid rgba(34,211,238,0.14)" }}
          >
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

          <div
            className="rounded-[10px] p-5 hover-lift"
            style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.7), rgba(4,10,16,0.7))", border: "1px solid rgba(34,211,238,0.14)" }}
          >
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

      {/* Daily Life */}
      <section id="daily" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24">
        <div className="mb-10">
          <div style={{ fontFamily: MONO, fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(245,247,250,0.55)" }}>
            // AEGIS FOR EVERY DAY
          </div>
          <h2 className="mt-2" style={{ fontFamily: SERIF, fontSize: "clamp(1.75rem,3.5vw,2.75rem)", color: "#f5f7fa", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Monad is fast enough to <em style={{ color: "#22d3ee" }}>replace your bank</em>.
          </h2>
          <p className="mt-3 max-w-2xl" style={{ fontFamily: SANS, fontSize: "1.02rem", lineHeight: 1.6, color: "rgba(245,247,250,0.7)" }}>
            10,000 TPS. Sub-second finality. Fees under a hundredth of a cent. Monad is the first chain quick enough for coffee,
            groceries, salaries and rent, not just trading. Aegis is the daily co pilot that makes it usable by humans.
          </p>
        </div>
        <div className="grid gap-px md:grid-cols-3 rounded-[10px] overflow-hidden" style={{ background: "rgba(34,211,238,0.14)" }}>
          {[
            { icon: Coffee, title: "Pay for coffee in 0.4s", body: "Tap to pay on Monad clears faster than Visa. Aegis previews the fee, the merchant and a plain English safety check before you sign." },
            { icon: ShoppingCart, title: "Grocery run, on chain", body: "Weekly spend tracked automatically. Aegis writes a Sunday summary of where your MON went, what saved you money and what to watch." },
            { icon: Send, title: "Send money anywhere instantly", body: "Global transfers in one Monad block. Aegis translates addresses to human names, flags scam contracts and simulates the exact amount received." },
            { icon: Wallet, title: "Salary streaming", body: "Get paid by the second on Monad. Aegis auto splits your paycheck into savings, bills and spending. No bank, no three day wait." },
            { icon: Bell, title: "Real time alerts", body: "Rug pull on a token you hold. Whale dumping your bag. Aegis pings you before the price moves, in language anyone understands." },
            { icon: Zap, title: "One tap DeFi", body: "Ask Aegis to park your paycheck at the best safe yield. It routes through vetted Monad protocols, shows the risk score and executes." },
          ].map((f) => (
            <div key={f.title} className="group relative p-6 bg-black transition-all duration-300 hover:bg-[rgba(34,211,238,0.04)] hover-lift">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(90deg,transparent,#22d3ee,transparent)" }} />
              <f.icon className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" style={{ color: "#22d3ee" }} strokeWidth={1.75} />
              <div className="mt-5" style={{ fontFamily: SERIF, fontSize: "1.35rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>{f.title}</div>
              <div className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,250,0.7)", fontFamily: SANS }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Monad */}
      <section id="monad" className="relative mx-auto max-w-[1560px] px-6 md:px-10 pb-24 grid md:grid-cols-2 gap-10">
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "0.66rem",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "rgba(245,247,250,0.55)",
            }}
          >
            // WHY MONAD
          </div>
          <h2
            className="mt-2"
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#f5f7fa",
            }}
          >
            10,000 TPS. <em style={{ color: "#22d3ee" }}>The new default chain</em>.
          </h2>
        </div>
        <p className="pt-2" style={{ fontFamily: SANS, fontSize: "1.05rem", lineHeight: 1.65, color: "rgba(245,247,250,0.72)" }}>
          Ethereum priced people out. Solana keeps breaking. Monad is what came next. Fully EVM compatible so every Solidity
          contract runs unchanged, but built on a parallel execution engine that pushes 10,000 transactions per second with
          sub second finality and fees measured in fractions of a cent. This is the first chain fast enough to carry the
          real global economy. Payments, payroll, savings, markets and everyday commerce all on one settlement layer.
          Aegis is the intelligence layer that turns that raw throughput into something a human can actually use.
        </p>
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
