import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketSnapshot, getOpportunities } from "@/lib/intelligence.functions";
import { formatUsd, type MonadToken } from "@/lib/monad-data";
import { useMemo } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Droplets,
  Target,
  Flame,
  ShieldAlert,
  Layers,
  Radar as RadarIcon,
} from "lucide-react";

export const Route = createFileRoute("/app/radar")({ component: RadarPage });

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";
const BORDER = "1px solid rgba(34,211,238,0.14)";
const PANEL_BG = "linear-gradient(180deg, rgba(10,18,28,0.65), rgba(4,10,16,0.65))";

type Regime = "trending_up" | "trending_down" | "range" | "volatile";

function classify(t: MonadToken): Regime {
  const c = t.change24h;
  const a = Math.abs(c);
  if (a > 10) return "volatile";
  if (c > 3) return "trending_up";
  if (c < -3) return "trending_down";
  return "range";
}

const REGIMES: Record<Regime, { label: string; color: string; icon: typeof TrendingUp }> = {
  trending_up: { label: "Trending Up", color: "#34d399", icon: TrendingUp },
  trending_down: { label: "Trending Down", color: "#fb7185", icon: TrendingDown },
  range: { label: "Range", color: "#fbbf24", icon: Minus },
  volatile: { label: "Volatile", color: "#a78bfa", icon: Zap },
};

function Eyebrow({ icon: Icon, children }: { icon: typeof Activity; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
      <span
        style={{
          fontFamily: MONO,
          fontSize: "0.62rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(245,247,250,0.6)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function HeatGrid({ tokens, maxVol, highlight }: { tokens: MonadToken[]; maxVol: number; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {tokens.map((t) => {
        const c = t.change24h;
        const abs = Math.min(15, Math.abs(c));
        const alpha = 0.12 + (abs / 15) * 0.55;
        const bg = c >= 0 ? `rgba(52,211,153,${alpha})` : `rgba(251,113,133,${alpha})`;
        return (
          <div
            key={t.symbol}
            className="rounded-[8px] p-3 hover-lift"
            style={{
              background: bg,
              border: highlight ? "1px solid rgba(34,211,238,0.35)" : "1px solid rgba(255,255,255,0.06)",
              boxShadow: highlight ? "inset 0 0 0 1px rgba(34,211,238,0.08)" : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: MONO, color: "#f5f7fa", fontSize: "0.86rem", fontWeight: 600 }}>{t.symbol}</span>
              <span
                className="text-[9px] uppercase tracking-[0.14em] px-1 py-0.5 rounded"
                style={{ background: "rgba(0,0,0,0.25)", color: "rgba(245,247,250,0.75)" }}
              >
                {t.narrative}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span style={{ color: "#f5f7fa", fontWeight: 700 }}>
                {c >= 0 ? "+" : ""}
                {c.toFixed(2)}%
              </span>
              <span className="text-[10px]" style={{ color: "rgba(245,247,250,0.75)", fontFamily: MONO }}>
                {formatUsd(t.priceUsd)}
              </span>
            </div>
            <div className="mt-2 h-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.25)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(t.volume24hUsd / maxVol) * 100}%`, background: "rgba(255,255,255,0.5)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({
  eyebrow,
  icon,
  className,
  children,
}: {
  eyebrow: string;
  icon: typeof Activity;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={"rounded-[10px] p-5 " + (className ?? "")}
      style={{ background: PANEL_BG, border: BORDER, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
    >
      <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RadarPage() {
  const snap = useServerFn(getMarketSnapshot);
  const opps = useServerFn(getOpportunities);
  const s = useQuery({ queryKey: ["snap"], queryFn: () => snap(), refetchInterval: 60_000 });
  const o = useQuery({ queryKey: ["opps"], queryFn: () => opps(), refetchInterval: 180_000 });

  const tokens = s.data?.tokens ?? [];
  const narratives = s.data?.narratives ?? [];
  const monadTokens = useMemo(() => tokens.filter((t) => t.chain === "Monad"), [tokens]);
  const globalTokens = useMemo(() => tokens.filter((t) => t.chain !== "Monad"), [tokens]);

  const regimes = useMemo(() => {
    const c: Record<Regime, number> = { trending_up: 0, trending_down: 0, range: 0, volatile: 0 };
    tokens.forEach((t) => c[classify(t)]++);
    return c;
  }, [tokens]);
  const total = tokens.length || 1;
  const dominant = (Object.entries(regimes) as [Regime, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "range";

  const gainers = useMemo(() => [...tokens].sort((a, b) => b.change24h - a.change24h).slice(0, 5), [tokens]);
  const losers = useMemo(() => [...tokens].sort((a, b) => a.change24h - b.change24h).slice(0, 5), [tokens]);
  const hotVolume = useMemo(() => [...tokens].sort((a, b) => b.volume24hUsd - a.volume24hUsd).slice(0, 5), [tokens]);
  const liquidity = useMemo(() => [...tokens].sort((a, b) => b.liquidityUsd - a.liquidityUsd).slice(0, 6), [tokens]);

  const maxVol = Math.max(1, ...tokens.map((t) => t.volume24hUsd));

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-8 pt-2 md:pt-3 pb-8 space-y-5">
      {/* Title */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "0.66rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(245,247,250,0.55)",
            }}
          >
            // MONAD · MARKET RADAR
          </div>
          <h1
            className="mt-2"
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(2rem,4vw,3rem)",
              color: "#f5f7fa",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Market <em style={{ color: "#22d3ee" }}>Radar</em>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(245,247,250,0.65)" }}>
            Monad ecosystem first, majors as reference. Regime, rotation, liquidity, and opportunity scan across{" "}
            <span style={{ color: "#22d3ee", fontFamily: MONO }}>{tokens.length} assets</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
            style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.7)" }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(245,247,250,0.6)",
            }}
          >
            {tokens.length} assets · 60s refresh
          </span>
        </div>
      </header>

      {/* Regime Dashboard */}
      <Panel eyebrow={`Market Regime · ${REGIMES[dominant].label} Dominant`} icon={Activity}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.entries(REGIMES) as [Regime, (typeof REGIMES)[Regime]][]).map(([k, cfg]) => {
            const count = regimes[k];
            const pct = ((count / total) * 100).toFixed(0);
            const Icon = cfg.icon;
            return (
              <div
                key={k}
                className="rounded-[8px] p-3"
                style={{ background: `${cfg.color}0f`, border: `1px solid ${cfg.color}40` }}
              >
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                <div className="mt-2 text-2xl font-bold tabular-nums" style={{ color: cfg.color }}>
                  {count}
                </div>
                <div className="text-[11px]" style={{ color: "rgba(245,247,250,0.6)" }}>
                  {cfg.label} · {pct}%
                </div>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: cfg.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Row: Opportunity Scanner + Sector Rotation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Opportunity Scanner · Live-Ranked" icon={Target}>
          {o.data && o.data.ok ? (
            <div className="space-y-3">
              {o.data.data.opportunities.map((op, i) => (
                <div
                  key={i}
                  className="rounded-[8px] p-3 flex items-start gap-3"
                  style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.14)" }}
                >
                  <div
                    className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                    style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)" }}
                  >
                    <Flame className="h-4 w-4" style={{ color: "#22d3ee" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontFamily: MONO, color: "#22d3ee", fontSize: "0.86rem" }}>{op.token}</span>
                      <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.5)" }}>
                        confidence
                      </span>
                      <span style={{ color: "#f5f7fa", fontWeight: 600 }}>{op.confidence}/100</span>
                      <span
                        className="ml-auto text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
                        style={{
                          background: op.riskScore > 6 ? "rgba(251,113,133,0.12)" : "rgba(52,211,153,0.12)",
                          color: op.riskScore > 6 ? "#fb7185" : "#34d399",
                          border: `1px solid ${op.riskScore > 6 ? "rgba(251,113,133,0.4)" : "rgba(52,211,153,0.4)"}`,
                        }}
                      >
                        risk {op.riskScore}/10
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm" style={{ color: "rgba(245,247,250,0.78)" }}>{op.thesis}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm" style={{ color: "rgba(245,247,250,0.5)" }}>
              {o.isLoading ? "Scanning for setups..." : "No opportunities returned."}
            </div>
          )}
        </Panel>

        <Panel eyebrow="Sector Rotation · 24h Strength" icon={Layers}>
          <div className="space-y-3">
            {narratives
              .slice()
              .sort((a, b) => b.strength - a.strength)
              .map((n) => {
                const pos = n.change >= 0;
                return (
                  <div key={n.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "#f5f7fa", fontWeight: 500 }}>{n.name}</span>
                      <span style={{ color: pos ? "#34d399" : "#fb7185", fontFamily: MONO, fontSize: "0.78rem" }}>
                        {pos ? "+" : ""}
                        {n.change.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, n.strength * 100)}%`,
                          background: "linear-gradient(90deg,#22d3ee,#0ea5b7)",
                          boxShadow: "0 0 8px rgba(34,211,238,0.5)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>

      {/* Row: Liquidity Radar + Confidence Map */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Volume Radar · 24h public API" icon={Droplets}>
          <div className="space-y-2.5">
            {liquidity.map((t) => {
              const ratio = t.volume24hUsd / Math.max(1, t.liquidityUsd);
              const hot = ratio > 1.2;
              return (
                <div key={t.symbol} className="grid grid-cols-[70px_1fr_auto] items-center gap-3 text-sm">
                  <span style={{ fontFamily: MONO, color: "#22d3ee" }}>{t.symbol}</span>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, (t.liquidityUsd / (liquidity[0]?.liquidityUsd || 1)) * 100)}%`,
                        background: hot ? "linear-gradient(90deg,#f59e0b,#fb7185)" : "linear-gradient(90deg,#22d3ee,#0ea5b7)",
                      }}
                    />
                  </div>
                  <span
                    className="tabular-nums text-[11px]"
                    style={{ color: hot ? "#fbbf24" : "rgba(245,247,250,0.6)", fontFamily: MONO }}
                  >
                    {formatUsd(t.volume24hUsd)}
                  </span>
                </div>
              );
            })}
            <p className="pt-2 text-[11px]" style={{ color: "rgba(245,247,250,0.5)" }}>
              Bars use public 24h volume from the live market API.
            </p>
          </div>
        </Panel>

        <Panel eyebrow="Confidence Map · Momentum × Whale Support" icon={ShieldAlert}>
          <div className="relative h-56 rounded-[8px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(34,211,238,0.15)" }}>
            {/* axes */}
            <div
              className="absolute left-0 top-1/2 h-px w-full"
              style={{ background: "rgba(34,211,238,0.15)" }}
            />
            <div className="absolute left-1/2 top-0 h-full w-px" style={{ background: "rgba(34,211,238,0.15)" }} />
            {tokens.map((t) => {
              const x = 50 + t.momentum * 45; // -1..1
              const y = 100 - t.whaleConcentration * 90 - 5;
              const size = 6 + Math.log10(Math.max(10, t.volume24hUsd)) * 1.2;
              return (
                <div
                  key={t.symbol}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width: size,
                      height: size,
                      background: t.change24h >= 0 ? "rgba(52,211,153,0.75)" : "rgba(251,113,133,0.75)",
                      boxShadow: `0 0 ${size}px ${t.change24h >= 0 ? "rgba(52,211,153,0.6)" : "rgba(251,113,133,0.6)"}`,
                    }}
                  />
                  <span
                    className="absolute left-3 top-0 text-[10px] whitespace-nowrap"
                    style={{ fontFamily: MONO, color: "rgba(245,247,250,0.7)" }}
                  >
                    {t.symbol}
                  </span>
                </div>
              );
            })}
            <div
              className="absolute bottom-1 left-2 text-[9px] uppercase tracking-[0.16em]"
              style={{ fontFamily: MONO, color: "rgba(245,247,250,0.4)" }}
            >
              ← momentum →
            </div>
            <div
              className="absolute top-1 right-2 text-[9px] uppercase tracking-[0.16em]"
              style={{ fontFamily: MONO, color: "rgba(245,247,250,0.4)" }}
            >
              ↑ whale concentration
            </div>
          </div>
        </Panel>
      </div>

      {/* Heatmap grid — Monad first, then global */}
      <Panel eyebrow="Asset Heatmap · 24h Performance · Monad-First" icon={RadarIcon}>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22d3ee", boxShadow: "0 0 8px #22d3ee" }} />
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#22d3ee" }}>
            Monad Ecosystem · {monadTokens.length}
          </span>
        </div>
        <HeatGrid tokens={monadTokens} maxVol={maxVol} highlight />
        <div className="flex items-center gap-2 mt-6 mb-3">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "rgba(245,247,250,0.4)" }} />
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>
            Global Majors · {globalTokens.length}
          </span>
        </div>
        <HeatGrid tokens={globalTokens} maxVol={maxVol} />
      </Panel>

      {/* Top Movers Matrix */}
      <div className="grid gap-6 lg:grid-cols-3">
        <MoverList title="Top Gainers" tone="#34d399" items={gainers} field="change24h" />
        <MoverList title="Top Losers" tone="#fb7185" items={losers} field="change24h" />
        <MoverList title="Hot Volume" tone="#22d3ee" items={hotVolume} field="volume24hUsd" />
      </div>
    </div>
  );
}

function MoverList({
  title,
  tone,
  items,
  field,
}: {
  title: string;
  tone: string;
  items: MonadToken[];
  field: "change24h" | "volume24hUsd";
}) {
  return (
    <div
      className="rounded-[10px] p-5"
      style={{ background: PANEL_BG, border: BORDER }}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone, boxShadow: `0 0 8px ${tone}` }} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: "0.62rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(245,247,250,0.65)",
          }}
        >
          {title}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((t) => (
          <div key={t.symbol} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: MONO, color: "#22d3ee" }}>{t.symbol}</span>
              <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.45)" }}>
                {t.narrative}
              </span>
            </div>
            <span style={{ color: tone, fontFamily: MONO, fontSize: "0.82rem", fontWeight: 600 }}>
              {field === "change24h"
                ? `${t.change24h >= 0 ? "+" : ""}${t.change24h.toFixed(2)}%`
                : formatUsd(t.volume24hUsd)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}