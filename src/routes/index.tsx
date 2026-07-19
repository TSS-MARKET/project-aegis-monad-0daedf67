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
import type { LucideIcon } from "lucide-react";
import { AegisLogo } from "@/components/aegis/logo";
import { WalletConnectButton } from "@/components/aegis/wallet-connect";
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

      <header className="relative mx-auto flex max-w-[1560px] items-center justify-between px-6 md:px-10 py-6">
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
          <Link
            to="/app"
            className="group relative inline-flex items-center gap-2 rounded-[6px] px-3 py-2 sm:px-4 sm:py-2.5 text-[0.68rem] sm:text-[0.72rem] font-bold uppercase tracking-[0.16em] cta-cyan overflow-hidden"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)" }} />
            <span className="relative">Launch</span> <ArrowRight className="h-3.5 w-3.5 relative transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative mx-auto max-w-[1560px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)] gap-10 lg:gap-16 items-start pt-10 pb-24"
        style={{ minHeight: "82vh" }}
      >
        {/* LEFT */}
        <div className="flex flex-col gap-8 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <span
              className="block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "#22d3ee", boxShadow: "0 0 0 3px rgba(34,211,238,0.18)" }}
            />
            <span
              className="flex items-center gap-x-2 flex-wrap md:whitespace-nowrap"
              style={{
                fontFamily: MONO,
                fontSize: "0.66rem",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              <span style={{ color: "#f5f7fa" }}>AEGIS · MONAD INTELLIGENCE</span>
              <span style={{ color: "rgba(34,211,238,0.5)" }}>//</span>
              <span style={{ color: "rgba(245,247,250,0.55)" }}>
                READ-ONLY: <span style={{ color: "#f5f7fa" }}>NEVER TOUCHES YOUR KEYS</span>
              </span>
            </span>
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              color: "#f5f7fa",
              fontSize: "clamp(2.25rem, 6.5vw, 4.75rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            <span className="block">The Monad firehose,</span>
            <span className="block">
              <em
                className="text-gradient"
                style={{ fontStyle: "italic", fontFamily: SERIF, fontWeight: 400 }}
              >
                translated into edge
              </em>
              <span style={{ color: "#f5f7fa" }}>.</span>
            </span>
          </h1>

          <p
            className="max-w-xl"
            style={{
              fontFamily: SANS,
              fontSize: "1.05rem",
              lineHeight: 1.6,
              color: "rgba(245,247,250,0.7)",
              margin: 0,
            }}
          >
            Monad ships 10,000 transactions a second. No human reads that. Aegis does — and hands you a plain-English brief on
            what's moving, which whales are accumulating, and where the risk actually lives. Grounded in on-chain evidence.
            Not vibes.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              to="/app"
              className="group relative inline-flex items-center gap-2.5 cta-cyan rounded-[6px] overflow-hidden"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: "0.82rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                padding: "1rem 1.6rem",
              }}
            >
              <span className="relative whitespace-nowrap">Launch Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>

            <Link
              to="/app/chat"
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
              <span className="whitespace-nowrap">Ask The Analyst</span>
            </Link>
          </div>

          <a
            href="#proof"
            className="group inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full"
            style={{
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
          </a>

          {/* Manifesto */}
          <div
            className="mt-4 max-w-lg"
            style={{
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
          className="relative rounded-[10px] p-6 sm:p-7 backdrop-blur-xl"
          style={{
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
            { icon: Activity, title: "Market Brief", body: "AI-authored ecosystem summary. Sentiment, movers, narrative rotation — refreshed every 2 minutes." },
            { icon: Compass, title: "Opportunities", body: "Grounded theses with confidence, catalyst, and risk. No 'to the moon' — only reasoning you can audit." },
            { icon: Radar, title: "Whale Radar", body: "Cluster wallet activity into human-readable stories. Not a wall of hashes." },
            { icon: MessageSquare, title: "Ask Aegis", body: "Chat with a Monad-native analyst. Every answer grounded in the live market state." },
          ].map((f) => (
            <div key={f.title} className="p-6 bg-black">
              <f.icon className="h-5 w-5" style={{ color: "#22d3ee" }} strokeWidth={1.75} />
              <div
                className="mt-5"
                style={{ fontFamily: SERIF, fontSize: "1.5rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}
              >
                {f.title}
              </div>
              <div className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,250,0.7)", fontFamily: SANS }}>
                {f.body}
              </div>
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
            10,000 TPS demands <em style={{ color: "#22d3ee" }}>a new analyst</em>.
          </h2>
        </div>
        <p
          className="pt-2"
          style={{
            fontFamily: SANS,
            fontSize: "1.05rem",
            lineHeight: 1.65,
            color: "rgba(245,247,250,0.72)",
          }}
        >
          Ethereum was slow enough for humans to keep up. Monad isn't. Parallel execution turns the mempool into a firehose no
          human eye can process. That's exactly the surface AI is best at compressing into insight — and it's the surface
          Aegis was built for, from the first block.
        </p>
      </section>

      <footer
        className="mx-auto max-w-[1560px] px-6 md:px-10 py-8 border-t border-[rgba(34,211,238,0.12)] flex justify-between"
        style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}
      >
        <span>Aegis · Monad Intelligence · Hackathon build</span>
        <span>Not financial advice.</span>
      </footer>
    </div>
  );
}
