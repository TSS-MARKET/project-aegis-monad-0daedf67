import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import { Sun, Coffee, Clock, TrendingUp, TrendingDown, Waves, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, PlayCircle, Share2, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getMarketState, formatUsd } from "@/lib/monad-data";
import { computeOpportunities } from "@/lib/opportunity-engine";
import { ExplainButton } from "@/components/aegis/explain-button";
import { getEventFeed } from "@/lib/intelligence.functions";

export const Route = createFileRoute("/app/digest")({ component: DigestPage });

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";
const SANS = "var(--font-sans)";

function greetingFor(hour: number): { label: string; icon: LucideIcon } {
  if (hour < 5) return { label: "Late-night brief", icon: Sun };
  if (hour < 12) return { label: "Good morning", icon: Coffee };
  if (hour < 18) return { label: "Afternoon brief", icon: Sun };
  return { label: "Evening wrap", icon: Sun };
}

function DigestPage() {
  const feedFn = useServerFn(getEventFeed);
  const feed = useQuery({ queryKey: ["digest-events-24h"], queryFn: () => feedFn({ data: { windowHours: 24, limit: 180 } }), staleTime: 60_000, refetchInterval: 60_000 });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { state, opps, greeting, dateLabel } = useMemo(() => {
    const s = getMarketState(now);
    const o = computeOpportunities(now, 3);
    const d = new Date(now);
    return {
      state: s,
      opps: o,
      greeting: greetingFor(d.getHours()),
      dateLabel: d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    };
  }, [now]);
  const events = feed.data?.events ?? [];

  const monad = state.tokens.filter((t) => t.chain === "Monad" && t.narrative !== "Stable");
  const gainers = [...monad].sort((a, b) => b.change24h - a.change24h).slice(0, 3);
  const losers = [...monad].sort((a, b) => a.change24h - b.change24h).slice(0, 2);

  const whales = [...events]
    .filter((e) => e.category === "whale_accumulation" || e.category === "whale_distribution")
    .sort((a, b) => (b.amountUsd ?? 0) - (a.amountUsd ?? 0))
    .slice(0, 4);

  const topNarrative = [...state.narratives].sort((a, b) => b.change - a.change)[0];
  const headline = [...events].sort((a, b) => b.importance * b.confidence - a.importance * a.confidence)[0];
  const Greet = greeting.icon;

  return (
    <div className="relative mx-auto max-w-[1100px] px-5 md:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3" style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,211,238,0.9)" }}>
            <Greet className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{greeting.label}</span>
            <span style={{ color: "rgba(245,247,250,0.35)" }}>//</span>
            <span style={{ color: "rgba(245,247,250,0.6)" }}>{dateLabel}</span>
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(2rem,4.5vw,3.2rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#f5f7fa", margin: 0 }}>
            Your Monad, <em style={{ color: "#22d3ee", fontStyle: "italic" }}>in 1 minute</em>.
          </h1>
          <p className="mt-3 max-w-xl" style={{ fontFamily: SANS, color: "rgba(245,247,250,0.65)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Skip the doom scroll. Aegis compresses Monad into a trader-ready brief: whales, liquidity, narratives, risks, and evidence you can ask about.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2 hover:bg-white/5 transition-colors" style={{ border: "1px solid rgba(245,247,250,0.15)", fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.85)" }}>
            <Bell className="w-3.5 h-3.5" strokeWidth={1.8} /> Deliver Daily
          </button>
          <button className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2 hover:bg-white/5 transition-colors" style={{ border: "1px solid rgba(245,247,250,0.15)", fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.85)" }}>
            <Share2 className="w-3.5 h-3.5" strokeWidth={1.8} /> Share
          </button>
        </div>
      </div>

      <div className="mb-8 inline-flex items-center gap-3 rounded-full px-4 py-2" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.22)" }}>
        <Clock className="w-4 h-4" style={{ color: "#22d3ee" }} strokeWidth={2} />
        <span style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.1em", color: "#f5f7fa" }}>
          <span style={{ color: "#22d3ee", fontWeight: 700 }}>~45 min saved</span>
          <span style={{ color: "rgba(245,247,250,0.55)" }}> vs Twitter, Telegram and six dashboards</span>
        </span>
      </div>

      {headline && (
        <div className="mb-6 relative rounded-[10px] p-6 md:p-8 backdrop-blur-xl hover-lift" style={{ border: "1px solid rgba(34,211,238,0.22)", background: "linear-gradient(180deg, rgba(10,18,28,0.85), rgba(4,10,16,0.85))", boxShadow: "0 24px 80px -24px rgba(34,211,238,0.3)" }}>
          <div className="flex items-center gap-2 mb-3" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#22d3ee" }}>
            <Sparkles className="w-3 h-3" strokeWidth={2} />
            <span>Headline · Importance {headline.importance}/100</span>
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.4rem,2.5vw,1.9rem)", lineHeight: 1.15, color: "#f5f7fa", margin: 0, letterSpacing: "-0.015em" }}>
            {headline.headline}
          </h2>
          <p className="mt-3" style={{ fontFamily: SANS, color: "rgba(245,247,250,0.75)", fontSize: "0.98rem", lineHeight: 1.6 }}>
            {headline.matters}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <ExplainButton prompt={`Explain the significance of ${headline.headline} and what I should do about it.`} eventId={headline.id} variant="solid" label="Ask Aegis" />
            <Link to="/app/timeline" className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 hover:bg-white/5 transition-colors" style={{ border: "1px solid rgba(245,247,250,0.15)", fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.7)" }}>
              See in Timeline <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <section className="rounded-[10px] p-5 md:p-6 backdrop-blur-xl hover-lift" style={{ border: "1px solid rgba(34,211,238,0.14)", background: "linear-gradient(180deg,rgba(10,18,28,0.7),rgba(4,10,16,0.7))" }}>
          <SectionTitle icon={TrendingUp} label="Movers overnight" />
          <ul className="space-y-2.5 mt-4">
            {gainers.map((t) => (
              <MoverRow key={t.symbol} symbol={t.symbol} name={t.name} pct={t.change24h} price={t.priceUsd} up />
            ))}
            {losers.map((t) => (
              <MoverRow key={t.symbol} symbol={t.symbol} name={t.name} pct={t.change24h} price={t.priceUsd} />
            ))}
          </ul>
          <Link to="/app/radar" className="mt-4 inline-flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#22d3ee" }}>
            All markets <ArrowRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        </section>

        <section className="rounded-[10px] p-5 md:p-6 backdrop-blur-xl hover-lift" style={{ border: "1px solid rgba(34,211,238,0.14)", background: "linear-gradient(180deg,rgba(10,18,28,0.7),rgba(4,10,16,0.7))" }}>
          <SectionTitle icon={Waves} label="Whales that mattered" />
          <ul className="space-y-2.5 mt-4">
            {whales.length === 0 && <li className="text-sm text-muted-foreground">Quiet window. No whale flows above $250K.</li>}
            {whales.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-1.5" style={{ borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
                <div className="min-w-0">
                  <div style={{ fontFamily: SANS, fontSize: "0.88rem", color: "#f5f7fa", fontWeight: 600 }}>
                    {e.asset?.symbol ?? "MON"} · <span style={{ color: e.category === "whale_accumulation" ? "#22d3ee" : "#f97316", fontWeight: 700 }}>{e.category === "whale_accumulation" ? "Accumulating" : "Distributing"}</span>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: "0.68rem", color: "rgba(245,247,250,0.5)" }}>{e.minutesAgo}m ago · {e.wallets[0]?.label ?? "Anon whale"}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: "0.82rem", color: "#f5f7fa", fontWeight: 700 }}>{formatUsd(e.amountUsd ?? 0)}</div>
              </li>
            ))}
          </ul>
          <Link to="/app/whales" className="mt-4 inline-flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#22d3ee" }}>
            Whale intelligence <ArrowRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        </section>

        <section className="rounded-[10px] p-5 md:p-6 backdrop-blur-xl hover-lift md:col-span-2" style={{ border: "1px solid rgba(34,211,238,0.14)", background: "linear-gradient(180deg,rgba(10,18,28,0.7),rgba(4,10,16,0.7))" }}>
          <SectionTitle icon={CheckCircle2} label="Top opportunities today" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {opps.map((o) => (
              <div key={o.token.symbol} className="rounded-[8px] p-4 hover-lift" style={{ border: "1px solid rgba(34,211,238,0.14)", background: "rgba(4,10,16,0.6)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontFamily: SERIF, fontSize: "1.15rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>#{o.rank} {o.token.symbol}</div>
                  <div style={{ fontFamily: MONO, fontSize: "0.66rem", color: "#22d3ee", letterSpacing: "0.1em" }}>{o.score}·{o.confidence}%</div>
                </div>
                <div className="mb-3" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>{o.setup} · {o.horizon}</div>
                <p style={{ fontFamily: SANS, fontSize: "0.83rem", lineHeight: 1.55, color: "rgba(245,247,250,0.75)" }}>{o.thesis}</p>
              </div>
            ))}
          </div>
          <Link to="/app/opportunities" className="mt-4 inline-flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#22d3ee" }}>
            Full opportunity engine <ArrowRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        </section>

        <section className="rounded-[10px] p-5 md:p-6 backdrop-blur-xl hover-lift" style={{ border: "1px solid rgba(34,211,238,0.14)", background: "linear-gradient(180deg,rgba(10,18,28,0.7),rgba(4,10,16,0.7))" }}>
          <SectionTitle icon={Sparkles} label="Narrative in play" />
          <div className="mt-4">
            <div style={{ fontFamily: SERIF, fontSize: "1.6rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>{topNarrative.name}</div>
            <div className="mt-1" style={{ fontFamily: MONO, fontSize: "0.72rem", color: topNarrative.change >= 0 ? "#22d3ee" : "#f97316" }}>
              {topNarrative.change >= 0 ? "+" : ""}{topNarrative.change}% momentum · strength {(topNarrative.strength * 100).toFixed(0)}%
            </div>
            <p className="mt-3" style={{ fontFamily: SANS, fontSize: "0.85rem", lineHeight: 1.55, color: "rgba(245,247,250,0.7)" }}>
              Capital is rotating into {topNarrative.name} names on Monad. Watch flows into related tokens for confirmation before chasing.
            </p>
          </div>
        </section>

        <section className="rounded-[10px] p-5 md:p-6 backdrop-blur-xl hover-lift" style={{ border: "1px solid rgba(245,158,11,0.18)", background: "linear-gradient(180deg,rgba(28,20,10,0.7),rgba(16,10,4,0.7))" }}>
          <SectionTitle icon={AlertTriangle} label="Risks worth watching" accent="#f59e0b" />
          <ul className="mt-4 space-y-2.5">
            {opps.flatMap((o) => o.risks.slice(0, 1).map((r, i) => (
              <li key={`${o.token.symbol}-${i}`} className="flex gap-2 items-start">
                <span className="mt-2 h-1 w-1 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
                <div>
                  <span style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.12em", color: "#f59e0b", textTransform: "uppercase" }}>{o.token.symbol}</span>
                  <div style={{ fontFamily: SANS, fontSize: "0.83rem", color: "rgba(245,247,250,0.75)", lineHeight: 1.5 }}>{r}</div>
                </div>
              </li>
            )))}
          </ul>
        </section>
      </div>

      <div className="mt-10 rounded-[10px] p-6 md:p-8 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ border: "1px solid rgba(34,211,238,0.16)", background: "linear-gradient(90deg,rgba(10,18,28,0.7),rgba(4,10,16,0.7))" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: "1.35rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>Have questions about anything above?</div>
          <div className="mt-1" style={{ fontFamily: SANS, color: "rgba(245,247,250,0.65)", fontSize: "0.92rem" }}>Ask Aegis. Every answer is grounded in the same events you just read.</div>
        </div>
        <Link to="/app/chat" className="inline-flex items-center gap-2 cta-cyan rounded-[6px] px-5 py-3" style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em" }}>
          <PlayCircle className="w-4 h-4" strokeWidth={2.2} /> Ask Aegis
        </Link>
      </div>

      <div className="mt-6 text-center" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(245,247,250,0.4)", textTransform: "uppercase" }}>
        {events.length > 0
          ? `Digest built from ${events.length} intelligence records · Monad · Refreshes every minute`
          : `Warming up · fetching Monad intelligence records · refreshes every minute`}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label, accent = "#22d3ee" }: { icon: LucideIcon; label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: accent }}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      <span>{label}</span>
    </div>
  );
}

function MoverRow({ symbol, name, pct, price, up }: { symbol: string; name: string; pct: number; price: number; up?: boolean }) {
  const color = up ? "#22d3ee" : "#f97316";
  const Arrow = up ? TrendingUp : TrendingDown;
  return (
    <li className="flex items-center justify-between gap-3 py-1.5" style={{ borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
      <div className="min-w-0">
        <div style={{ fontFamily: SANS, fontSize: "0.88rem", color: "#f5f7fa", fontWeight: 600 }}>{symbol} <span style={{ color: "rgba(245,247,250,0.45)", fontWeight: 400 }}>· {name}</span></div>
        <div style={{ fontFamily: MONO, fontSize: "0.68rem", color: "rgba(245,247,250,0.5)" }}>${price < 1 ? price.toFixed(4) : price.toFixed(2)}</div>
      </div>
      <div className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: "0.82rem", fontWeight: 700, color }}>
        <Arrow className="w-3.5 h-3.5" strokeWidth={2.2} />
        {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
      </div>
    </li>
  );
}
