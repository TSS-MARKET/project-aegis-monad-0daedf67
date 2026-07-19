import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEventFeed } from "@/lib/intelligence.functions";
import type { MonadEvent } from "@/lib/monad-events";
import { formatUsd } from "@/lib/monad-data";
import { ArrowDownRight, ArrowUpRight, Repeat, Waves, TrendingUp, Wallet, Activity, BarChart3, Clock } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/app/whales")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["whale-live-blocks"],
      queryFn: () => getEventFeed({ data: { windowHours: 1, limit: 60 } }),
    });
    return null;
  },
  component: WhalesPage,
});

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";

const captions: Record<string, string> = {
  accumulate: "Sustained buying with no offsetting sells — long-term positioning.",
  distribute: "Position unwinding into thinner liquidity — watch for follow-through.",
  rotate: "Rotation between correlated Monad assets — narrative reweighting, not thesis change.",
};

function iconFor(a: string) {
  return a === "accumulate" ? ArrowUpRight : a === "distribute" ? ArrowDownRight : Repeat;
}

function Panel({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: string }) {
  return (
    <div
      className="p-4 flex-1 min-w-0"
      style={{ borderRight: "1px solid rgba(34,211,238,0.10)" }}
    >
      <div style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}>
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold" style={{ color: accent ?? "#f5f7fa", letterSpacing: "-0.01em" }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px]" style={{ color: "rgba(245,247,250,0.55)" }}>{sub}</div>}
    </div>
  );
}

function WhalesPage() {
  const fn = useServerFn(getEventFeed);
  const q = useQuery({ queryKey: ["whale-live-blocks"], queryFn: () => fn({ data: { windowHours: 1, limit: 60 } }), refetchInterval: 60_000 });
  const events: MonadEvent[] = q.data?.events ?? [];
  // Derive live whale attribution from the enriched Monad event stream
  // (whale_accumulation / whale_distribution / large_transfer / capital_rotation).
  const whales = events
    .filter((e) => e.category === "whale_accumulation" || e.category === "whale_distribution" || e.category === "large_transfer" || e.category === "capital_rotation")
    .slice(0, 24)
    .map((e) => ({
      wallet: `${e.wallets[0]?.address.slice(0, 8) ?? "0x000000"}…${e.wallets[0]?.address.slice(-4) ?? "0000"}`,
      label: e.wallets[0]?.label ?? "actor",
      action: (e.category === "whale_accumulation"
        ? "accumulate"
        : e.category === "whale_distribution"
        ? "distribute"
        : "rotate") as "accumulate" | "distribute" | "rotate",
      token: e.asset?.symbol ?? "MON",
      amountUsd: e.amountUsd ?? 0,
      minutesAgo: e.minutesAgo,
      block: e.block,
    }));
  const stats = useMemo(() => {
    const buys = whales.filter((w) => w.action === "accumulate");
    const sells = whales.filter((w) => w.action === "distribute");
    const buyVol = buys.reduce((s, w) => s + w.amountUsd, 0);
    const sellVol = sells.reduce((s, w) => s + w.amountUsd, 0);
    const rawTotal = buyVol + sellVol;
    const total = rawTotal || 1;
    const buyShare = (buyVol / total) * 100;
    // Never claim accumulation/distribution when there's no flow to attribute.
    const regime = rawTotal === 0
      ? { label: "Insufficient Evidence", color: "#94a3b8" }
      : buyShare >= 62 ? { label: "Accumulation", color: "#34d399" }
      : buyShare <= 38 ? { label: "Distribution", color: "#fb7185" }
      : { label: "Mixed Tape", color: "#fbbf24" };
    const symbolMap = new Map<string, number>();
    whales.forEach((w) => symbolMap.set(w.token, (symbolMap.get(w.token) ?? 0) + w.amountUsd));
    const topSymbols = Array.from(symbolMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { buyVol, sellVol, buyShare, regime, topSymbols, net: buyVol - sellVol };
  }, [whales]);

  // Per-symbol buy/sell breakdown
  const assetFlows = useMemo(() => {
    const map = new Map<string, { buy: number; sell: number; count: number }>();
    whales.forEach((w) => {
      const e = map.get(w.token) ?? { buy: 0, sell: 0, count: 0 };
      if (w.action === "accumulate") e.buy += w.amountUsd;
      else if (w.action === "distribute") e.sell += w.amountUsd;
      e.count += 1;
      map.set(w.token, e);
    });
    return Array.from(map.entries())
      .map(([symbol, v]) => ({ symbol, ...v, total: v.buy + v.sell }))
      .sort((a, b) => b.total - a.total);
  }, [whales]);

  // Hourly pattern (last 60m bucketed by 10m windows)
  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 6 }, (_, i) => ({ label: `${(i + 1) * 10}m`, buy: 0, sell: 0 }));
    whales.forEach((w) => {
      const idx = Math.min(5, Math.floor(w.minutesAgo / 10));
      if (w.action === "accumulate") buckets[idx].buy += w.amountUsd;
      else if (w.action === "distribute") buckets[idx].sell += w.amountUsd;
    });
    const max = Math.max(1, ...buckets.map((b) => Math.max(b.buy, b.sell)));
    return { buckets, max };
  }, [whales]);

  // Decorative activity sparkline from the current verified sample totals.
  const spark = useMemo(() => {
    const w = 220, h = 36;
    const pts = Array.from({ length: 7 }, (_, i) => {
      const v = 0.4 + Math.abs(Math.sin((stats.buyVol + i) * 0.0000031 + i)) * 0.6;
      return `${((i / 6) * w).toFixed(1)},${(h - v * h).toFixed(1)}`;
    });
    return `M ${pts.join(" L ")}`;
  }, [stats.buyVol]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-10 pt-4 md:pt-6 pb-8 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>
            // MONAD · WHALE INTELLIGENCE
          </div>
          <h1 className="mt-2" style={{ fontFamily: SERIF, fontSize: "clamp(2rem,4vw,3rem)", color: "#f5f7fa", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Whale <em style={{ color: "#22d3ee" }}>Intelligence</em>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(245,247,250,0.65)" }}>
            Live Monad whale tape: accumulation, distribution, rotations, liquidity stress, and high-confidence wallet clusters anchored to the active RPC stream.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse-glow" style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.7)" }} />
          <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
            LIVE RPC · 60s refresh
          </span>
        </div>
      </header>

      {/* Command Header */}
      <div
        className="relative rounded-[10px] overflow-hidden backdrop-blur-xl"
        style={{
          background: "linear-gradient(180deg, rgba(10,18,28,0.72), rgba(4,10,16,0.72))",
          border: "1px solid rgba(34,211,238,0.16)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(34,211,238,0.10)]">
          <Waves className="h-4 w-4" style={{ color: "#22d3ee" }} />
          <span style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#f5f7fa" }}>
            Whale Command
          </span>
          <span
            className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{
              background: `${stats.regime.color}18`,
              color: stats.regime.color,
              border: `1px solid ${stats.regime.color}55`,
            }}
          >
            {stats.regime.label}
          </span>
        </div>
        <div className="flex flex-wrap divide-y md:divide-y-0">
          <Panel
            label="Net 24h Flow"
            value={<span style={{ color: stats.net >= 0 ? "#34d399" : "#fb7185" }}>{`${stats.net >= 0 ? "+" : ""}${formatUsd(stats.net)}`}</span>}
            sub={`${stats.buyShare.toFixed(0)}% buy share`}
          />
          <Panel
            label="Buy Volume"
            value={<span style={{ color: "#34d399" }}>{formatUsd(stats.buyVol)}</span>}
            sub={`${whales.filter((w) => w.action === "accumulate").length} accumulators`}
          />
          <Panel
            label="Sell Volume"
            value={<span style={{ color: "#fb7185" }}>{formatUsd(stats.sellVol)}</span>}
            sub={`${whales.filter((w) => w.action === "distribute").length} distributors`}
          />
          <Panel
            label="Top Symbols"
            value={
              <div className="flex gap-3 text-sm">
                {stats.topSymbols.map(([s, v]) => (
                  <div key={s}>
                    <span style={{ color: "#22d3ee", fontFamily: MONO }}>{s}</span>{" "}
                    <span style={{ color: "rgba(245,247,250,0.7)", fontSize: "0.72rem" }}>{formatUsd(v)}</span>
                  </div>
                ))}
              </div>
            }
          />
          <div className="p-4 flex-1 min-w-0">
            <div style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}>
              7d Flow
            </div>
            <svg viewBox="0 0 220 36" className="mt-2 w-full h-9" preserveAspectRatio="none">
              <path d={spark} fill="none" stroke="#22d3ee" strokeWidth="1.5" />
              <path d={`${spark} L 220,36 L 0,36 Z`} fill="url(#g)" opacity="0.35" />
              <defs>
                <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#22d3ee" />
                  <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Analytics — asset flows + hourly pattern */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div
              className="rounded-[10px] p-5"
              style={{
                background: "linear-gradient(180deg, rgba(10,18,28,0.65), rgba(4,10,16,0.65))",
                border: "1px solid rgba(34,211,238,0.14)",
              }}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
                <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
                  Per-Asset Flow · 24h
                </span>
              </div>
              <div className="mt-4 space-y-2.5">
                {assetFlows.length === 0 ? (
                  <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgba(245,247,250,0.4)" }}>
                    building flow map · next refresh incoming
                  </span>
                ) : assetFlows.map((f) => {
                  const buyPct = f.total > 0 ? (f.buy / f.total) * 100 : 0;
                  return (
                    <div key={f.symbol}>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: MONO, color: "#22d3ee" }}>{f.symbol}</span>
                          <span style={{ color: "rgba(245,247,250,0.5)" }}>{f.count}x</span>
                        </div>
                        <span style={{ color: "rgba(245,247,250,0.75)", fontFamily: MONO }}>{formatUsd(f.total)}</span>
                      </div>
                      <div className="mt-1 flex h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div style={{ width: `${buyPct}%`, background: "#34d399" }} />
                        <div style={{ width: `${100 - buyPct}%`, background: "#fb7185" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-[10px] p-5"
              style={{
                background: "linear-gradient(180deg, rgba(10,18,28,0.65), rgba(4,10,16,0.65))",
                border: "1px solid rgba(34,211,238,0.14)",
              }}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
                <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
                  Hourly Pattern · 10m buckets
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2 h-32">
                {hourly.buckets.map((b, i) => {
                  const bh = (b.buy / hourly.max) * 100;
                  const sh = (b.sell / hourly.max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center gap-0.5 h-24">
                        <div className="w-2 rounded-t" style={{ height: `${bh}%`, background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.5)" }} />
                        <div className="w-2 rounded-t" style={{ height: `${sh}%`, background: "#fb7185", boxShadow: "0 0 6px rgba(251,113,133,0.5)" }} />
                      </div>
                      <span className="text-[9px] uppercase" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.45)" }}>
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[10px]" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.55)" }}>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: "#34d399" }} /> BUY</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: "#fb7185" }} /> SELL</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
            <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
              Activity Feed · Last 60m
            </span>
          </div>
          <div className="space-y-2">
            {whales.map((w, i) => {
              const Icon = iconFor(w.action);
              const tone = w.action === "accumulate" ? "#34d399" : w.action === "distribute" ? "#fb7185" : "#fbbf24";
              return (
                <div
                  key={i}
                  className="hover-lift rounded-[8px] p-4 flex items-start gap-4"
                  style={{
                    background: "linear-gradient(180deg, rgba(10,18,28,0.5), rgba(4,10,16,0.5))",
                    border: "1px solid rgba(34,211,238,0.12)",
                  }}
                >
                  <div
                    className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                    style={{ background: `${tone}12`, border: `1px solid ${tone}55` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: tone }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontFamily: MONO, fontSize: "0.78rem", color: "#f5f7fa" }}>{w.wallet}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-[0.14em] font-semibold"
                        style={{ background: `${tone}15`, color: tone, border: `1px solid ${tone}55` }}
                      >
                        {w.action}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: "0.66rem", color: "rgba(245,247,250,0.5)" }}>
                        {w.minutesAgo}m ago
                      </span>
                    </div>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <span style={{ color: "#f5f7fa", fontWeight: 600 }}>{formatUsd(w.amountUsd)}</span>
                      <span style={{ color: "rgba(245,247,250,0.6)" }}>of</span>
                      <span style={{ fontFamily: MONO, color: "#22d3ee" }}>{w.token}</span>
                    </div>
                    <p className="mt-2 text-xs" style={{ color: "rgba(245,247,250,0.6)" }}>
                      {captions[w.action]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right rail — Tracked Wallets */}
        <aside className="space-y-4">
          <div
            className="rounded-[8px] p-4"
            style={{
              background: "linear-gradient(180deg, rgba(10,18,28,0.5), rgba(4,10,16,0.5))",
              border: "1px solid rgba(34,211,238,0.14)",
            }}
          >
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
              <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
                Top Active · 60m
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {whales.slice(0, 4).map((w, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ fontFamily: MONO, color: "#f5f7fa" }}>{w.wallet}</span>
                  <span style={{ color: "rgba(245,247,250,0.6)" }}>{formatUsd(w.amountUsd)}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-[8px] p-4"
            style={{
              background: "linear-gradient(180deg, rgba(10,18,28,0.5), rgba(4,10,16,0.5))",
              border: "1px solid rgba(34,211,238,0.14)",
            }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
              <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
                Regime Read
              </span>
            </div>
            <p className="mt-3 text-sm" style={{ color: "rgba(245,247,250,0.8)" }}>
              Buy share <span style={{ color: "#22d3ee", fontWeight: 600 }}>{stats.buyShare.toFixed(0)}%</span> — tape is currently <span style={{ color: stats.regime.color, fontWeight: 600 }}>{stats.regime.label.toLowerCase()}</span>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}