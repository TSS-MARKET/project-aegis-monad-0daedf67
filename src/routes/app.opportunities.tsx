import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Zap,
  Flame,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  Radar,
} from "lucide-react";
import { getOpportunityBoard } from "@/lib/intelligence.functions";
import { ExplainButton } from "@/components/aegis/explain-button";

export const Route = createFileRoute("/app/opportunities")({
) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["opportunity-board"],
      queryFn: () => getOpportunityBoard({ data: { limit: 6 } }),
    });
    return null;
  },
  component: OpportunitiesPage,
});

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";

const SETUP_STYLE: Record<string, { label: string; color: string; bg: string; Icon: typeof TrendingUp }> = {
  breakout: { label: "Breakout", color: "#22d3ee", bg: "rgba(34,211,238,0.14)", Icon: TrendingUp },
  accumulation: { label: "Accumulation", color: "#7dd3fc", bg: "rgba(125,211,252,0.12)", Icon: Activity },
  "rotation-in": { label: "Rotation In", color: "#a78bfa", bg: "rgba(167,139,250,0.14)", Icon: Radar },
  distribution: { label: "Distribution", color: "#f97316", bg: "rgba(249,115,22,0.14)", Icon: TrendingDown },
  fade: { label: "Fade", color: "#fb7185", bg: "rgba(251,113,133,0.14)", Icon: TrendingDown },
  "base-building": { label: "Base Building", color: "#facc15", bg: "rgba(250,204,21,0.14)", Icon: Target },
};

function OpportunitiesPage() {
  const fetchBoard = useServerFn(getOpportunityBoard);
  const { data, isLoading } = useQuery({
    queryKey: ["opportunity-board"],
    queryFn: () => fetchBoard({ data: { limit: 6 } }),
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  const opportunities = data?.opportunities ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(
    () => opportunities.find((o) => o.token.symbol === activeId) ?? opportunities[0],
    [opportunities, activeId],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-10 pt-4 md:pt-6 pb-24 md:pb-8 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(34,211,238,0.85)",
            }}
          >
            Aegis · Opportunity Engine
          </div>
          <h1
            className="mt-1"
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
              color: "#f5f7fa",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Ranked setups on <em style={{ color: "#22d3ee" }}>Monad</em>
          </h1>
          <p className="mt-2 text-sm max-w-2xl" style={{ color: "rgba(245,247,250,0.6)" }}>
            Deterministic scoring across five signals — momentum, turnover, live RPC activity, narrative, and event pressure —
            grounded in public market data and recent Monad blocks. Not financial advice.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-[6px]"
          style={{
            background: "rgba(10,18,28,0.6)",
            border: "1px solid rgba(34,211,238,0.2)",
            fontFamily: MONO,
            fontSize: "0.6rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(245,247,250,0.65)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-pulse-glow" style={{ background: "#22d3ee", boxShadow: "0 0 8px rgba(34,211,238,0.7)" }} />
          Scored · refreshes every 2m
        </div>
      </header>

      {isLoading || opportunities.length === 0 ? (
        <div className="grid md:grid-cols-3 lg:grid-cols-[1fr_1fr_1.4fr] gap-4">
          <div className="h-[560px] rounded-[10px]" style={{ background: "rgba(10,18,28,0.5)", border: "1px solid rgba(34,211,238,0.1)" }} />
          <div className="h-[560px] rounded-[10px]" style={{ background: "rgba(10,18,28,0.5)", border: "1px solid rgba(34,211,238,0.1)" }} />
          <div className="h-[560px] rounded-[10px]" style={{ background: "rgba(10,18,28,0.5)", border: "1px solid rgba(34,211,238,0.1)" }} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: ranked table */}
          <div
            className="rounded-[10px] overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(10,18,28,0.6), rgba(4,10,16,0.6))",
              border: "1px solid rgba(34,211,238,0.14)",
            }}
          >
            <div
              className="px-4 py-3 grid grid-cols-[24px_1fr_92px_72px_60px] gap-3 items-center"
              style={{
                fontFamily: MONO,
                fontSize: "0.58rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(245,247,250,0.5)",
                borderBottom: "1px solid rgba(34,211,238,0.1)",
              }}
            >
              <span>#</span>
              <span>Setup</span>
              <span className="text-right">Score</span>
              <span className="text-right">Conf.</span>
              <span className="text-right">Risk</span>
            </div>
            {opportunities.map((o) => {
              const style = SETUP_STYLE[o.setup] ?? SETUP_STYLE.breakout;
              const isActive = active?.token.symbol === o.token.symbol;
              return (
                <button
                  key={o.token.symbol}
                  onClick={() => setActiveId(o.token.symbol)}
                  className="w-full text-left px-4 py-3.5 grid grid-cols-[24px_1fr_92px_72px_60px] gap-3 items-center transition-colors hover:bg-[rgba(34,211,238,0.05)]"
                  style={{
                    borderBottom: "1px solid rgba(34,211,238,0.06)",
                    background: isActive ? "rgba(34,211,238,0.06)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "0.7rem",
                      color: o.rank === 1 ? "#22d3ee" : "rgba(245,247,250,0.5)",
                    }}
                  >
                    {o.rank.toString().padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: SERIF, fontSize: "1.15rem", color: "#f5f7fa" }}>{o.token.symbol}</span>
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
                        style={{
                          background: style.bg,
                          border: `1px solid ${style.color}55`,
                          color: style.color,
                          fontFamily: MONO,
                          fontSize: "0.55rem",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                        }}
                      >
                        <style.Icon className="h-2.5 w-2.5" strokeWidth={2} /> {style.label}
                      </span>
                    </div>
                    <div
                      className="mt-0.5 truncate"
                      style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(245,247,250,0.5)" }}
                    >
                      {o.token.narrative} · {o.horizon} · {o.evidence.length} events
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: MONO, fontSize: "1rem", color: "#22d3ee" }}>{o.score}</div>
                    <MiniBar value={o.score / 100} />
                  </div>
                  <div className="text-right" style={{ fontFamily: MONO, fontSize: "0.8rem", color: "rgba(245,247,250,0.85)" }}>
                    {o.confidence}
                  </div>
                  <div className="text-right" style={{ fontFamily: MONO, fontSize: "0.8rem", color: o.riskScore > 6 ? "#fb7185" : "rgba(245,247,250,0.85)" }}>
                    {o.riskScore}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: detail panel */}
          {active && <DetailPanel o={active} />}
        </div>
      )}
    </div>
  );
}

function MiniBar({ value }: { value: number }) {
  return (
    <div className="mt-1 h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.1)" }}>
      <div
        className="h-full"
        style={{
          width: `${Math.round(value * 100)}%`,
          background: "linear-gradient(90deg, rgba(34,211,238,0.4), #22d3ee)",
        }}
      />
    </div>
  );
}

function DetailPanel({ o }: { o: ReturnType<typeof Object> extends never ? never : any }) {
  const style = SETUP_STYLE[o.setup as keyof typeof SETUP_STYLE] ?? SETUP_STYLE.breakout;
  return (
    <div
      className="rounded-[10px] p-5 md:p-6 space-y-5"
      style={{
        background: "linear-gradient(180deg, rgba(10,18,28,0.75), rgba(4,10,16,0.75))",
        border: "1px solid rgba(34,211,238,0.2)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 3px rgba(34,211,238,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px]"
            style={{
              background: style.bg,
              border: `1px solid ${style.color}55`,
              color: style.color,
              fontFamily: MONO,
              fontSize: "0.58rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            <style.Icon className="h-3 w-3" /> {style.label} · {o.horizon}
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span style={{ fontFamily: SERIF, fontSize: "2.2rem", color: "#f5f7fa", letterSpacing: "-0.02em" }}>
              {o.token.symbol}
            </span>
            <span style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.14em", color: "rgba(245,247,250,0.55)" }}>
              {o.token.name} · {o.token.narrative}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}>
            Score / Conf.
          </div>
          <div className="mt-1 flex items-baseline gap-1 justify-end">
            <span style={{ fontFamily: SERIF, fontSize: "2rem", color: "#22d3ee" }}>{o.score}</span>
            <span style={{ fontFamily: MONO, fontSize: "0.75rem", color: "rgba(245,247,250,0.5)" }}>· {o.confidence}</span>
          </div>
        </div>
      </div>

      {/* Thesis */}
      <p className="text-sm leading-relaxed" style={{ color: "rgba(245,247,250,0.88)" }}>
        {o.thesis}
      </p>

      {/* Score breakdown */}
      <div className="space-y-2">
        <SectionLabel>Score breakdown</SectionLabel>
        <div className="space-y-1.5">
          {o.components.map((c: any) => (
            <div key={c.label} className="grid grid-cols-[110px_1fr_auto] items-center gap-3">
              <span style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(245,247,250,0.7)" }}>
                {c.label}
              </span>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.08)" }}>
                <div
                  className="h-full"
                  style={{
                    width: `${Math.round(c.value * 100)}%`,
                    background: "linear-gradient(90deg, rgba(34,211,238,0.35), #22d3ee)",
                  }}
                />
              </div>
              <span style={{ fontFamily: MONO, fontSize: "0.65rem", color: "rgba(245,247,250,0.6)" }}>
                {c.raw} · +{Math.round(c.value * c.weight)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Catalysts + Risks */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <SectionLabel color="#22d3ee" Icon={Flame}>Catalysts</SectionLabel>
          <ul className="mt-2 space-y-1.5 text-sm" style={{ color: "rgba(245,247,250,0.85)" }}>
            {o.catalysts.map((c: string, i: number) => (
              <li key={i} className="flex gap-2"><span style={{ color: "#22d3ee" }}>—</span> {c}</li>
            ))}
          </ul>
        </div>
        <div>
          <SectionLabel color="#fb7185" Icon={ShieldAlert}>Risks</SectionLabel>
          <ul className="mt-2 space-y-1.5 text-sm" style={{ color: "rgba(245,247,250,0.85)" }}>
            {o.risks.map((c: string, i: number) => (
              <li key={i} className="flex gap-2"><span style={{ color: "#fb7185" }}>—</span> {c}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Evidence */}
      {o.evidence.length > 0 && (
        <div>
          <SectionLabel Icon={Zap}>Grounding evidence</SectionLabel>
          <div className="mt-2 space-y-2">
            {o.evidence.map((e: any) => (
              <div
                key={e.id}
                className="px-3 py-2 rounded-[6px]"
                style={{
                  background: "rgba(10,18,28,0.5)",
                  border: "1px solid rgba(34,211,238,0.12)",
                }}
              >
                <div className="text-sm" style={{ color: "#f5f7fa" }}>{e.headline}</div>
                <div
                  className="mt-1 flex items-center gap-2 flex-wrap"
                  style={{ fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}
                >
                  <Clock className="h-2.5 w-2.5" /> {e.minutesAgo}m ago
                  <span>·</span>
                  <span>imp {e.importance}</span>
                  <span>·</span>
                  <span>conf {e.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invalidation + CTA */}
      <div
        className="p-3 rounded-[6px] text-sm"
        style={{
          background: "rgba(251,113,133,0.06)",
          border: "1px solid rgba(251,113,133,0.25)",
          color: "rgba(245,247,250,0.85)",
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#fb7185" }}>
          Invalidation
        </span>
        <div className="mt-1">{o.invalidatesIf}</div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <ExplainButton
          variant="solid"
          size="md"
          label={`Deep-dive ${o.token.symbol}`}
          focus={o.token.symbol}
          prompt={`Deep-dive the ${o.token.symbol} ${SETUP_STYLE[o.setup as keyof typeof SETUP_STYLE]?.label ?? o.setup} setup. Score ${o.score}, confidence ${o.confidence}. Walk me through the evidence and what would invalidate the thesis.`}
        />
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  Icon,
  color = "rgba(245,247,250,0.55)",
}: {
  children: React.ReactNode;
  Icon?: typeof Zap;
  color?: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{
        fontFamily: MONO,
        fontSize: "0.58rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color,
      }}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={1.75} />}
      {children}
    </div>
  );
}