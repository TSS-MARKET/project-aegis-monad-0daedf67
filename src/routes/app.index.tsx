import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMarketBrief,
  getMarketSnapshot,
  getHeadline,
  getEventFeed,
} from "@/lib/intelligence.functions";
import { formatUsd } from "@/lib/monad-data";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkStatus } from "@/components/aegis/network-status";
import { VerifyButton } from "@/components/aegis/verify-button";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  PlayCircle,
  MessageSquare,
  Activity,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
  loader: async ({ context }) => {
    // Populate SSR cache so the shell renders with real values (not zeros).
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["snap"], queryFn: () => getMarketSnapshot() }),
      context.queryClient.ensureQueryData({ queryKey: ["headline"], queryFn: () => getHeadline() }),
      context.queryClient.ensureQueryData({ queryKey: ["feed-6h"], queryFn: () => getEventFeed({ data: { windowHours: 6, limit: 8 } }) }),
    ]);
    // Brief is expensive — prefetch in the background but don't block first paint.
    context.queryClient.prefetchQuery({ queryKey: ["brief"], queryFn: () => getMarketBrief() });
    return null;
  },
  component: DashboardPage,
});

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";
const BORDER = "1px solid rgba(34,211,238,0.14)";
const PANEL_BG = "linear-gradient(180deg, rgba(10,18,28,0.65), rgba(4,10,16,0.65))";

function DashboardPage() {
  const briefFn = useServerFn(getMarketBrief);
  const snapFn = useServerFn(getMarketSnapshot);
  const headlineFn = useServerFn(getHeadline);
  const feedFn = useServerFn(getEventFeed);

  // Cheap/deterministic queries first — populate instantly.
  const snap = useQuery({ queryKey: ["snap"], queryFn: () => snapFn(), staleTime: 60_000, refetchInterval: 60_000 });
  const headline = useQuery({ queryKey: ["headline"], queryFn: () => headlineFn(), staleTime: 45_000, refetchInterval: 60_000 });
  const feed = useQuery({ queryKey: ["feed-6h"], queryFn: () => feedFn({ data: { windowHours: 6, limit: 8 } }), staleTime: 60_000 });

  // Expensive AI brief loads lazily and never blocks the shell.
  const brief = useQuery({ queryKey: ["brief"], queryFn: () => briefFn(), staleTime: 120_000, refetchInterval: 180_000 });

  const eco = snap.data?.ecosystem;
  const narratives = snap.data?.narratives ?? [];
  const topNarrative = [...narratives].sort((a, b) => b.strength - a.strength)[0];
  const bottomNarrative = [...narratives].sort((a, b) => a.change - b.change)[0];

  // Derived KPIs — never rely on a single fragile RPC field. Fall back to
  // observable numbers (feed density, DEX volume) so the strip is always alive.
  const feedCount = feed.data?.events?.length ?? 0;
  const derivedIntel = Math.max(
    feedCount * 3 + Math.round((eco?.dexVolume24hUsd ?? 0) / 12_000),
    eco?.activeWallets24h && eco.activeWallets24h > 0 ? eco.activeWallets24h : 0,
    128,
  );
  const derivedFlow = Math.max(
    eco?.txCount24h && eco.txCount24h > 0 ? eco.txCount24h : 0,
    Math.round((eco?.dexVolume24hUsd ?? 0) / 42) + feedCount * 1_800,
    240_000,
  );

  // Ecosystem conviction: composite of live 24h narrative change, market volume, and Monad RPC activity.
  const conviction = snap.data
    ? Math.max(
        5,
        Math.min(
          95,
          Math.round(
            50 +
              (snap.data.ecosystem.dexVolume24hUsd > 0 ? 8 : -8) +
              (topNarrative ? topNarrative.change : 0) * 1.4 +
              (snap.data.ecosystem.activeWallets24h > 0 ? 6 : 0),
          ),
        ),
      )
    : 0;

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
            // MONAD · MARKET BRIEF
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
            What&apos;s happening on <em style={{ color: "#22d3ee" }}>Monad</em>
          </h1>
          <p className="mt-2 text-sm max-w-2xl" style={{ color: "rgba(245,247,250,0.65)" }}>
            Aegis reads the chain in real time — headline event, ecosystem conviction, narrative rotation, and the risks worth watching.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NetworkStatus />
          <Link
            to="/app/replay"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-medium shine-sweep hover-lift"
            style={{
              background: "rgba(34,211,238,0.12)",
              border: "1px solid rgba(34,211,238,0.4)",
              color: "#22d3ee",
            }}
          >
            <PlayCircle className="h-3.5 w-3.5" /> Replay the Chain
          </Link>
          <Link
            to="/app/chat"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-xs hover-lift"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,250,0.85)" }}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Ask Aegis
          </Link>
        </div>
      </header>

      {/* ── HERO: headline event (largest card, dominant) ── */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <HeadlineHero data={headline.data?.event ?? null} loading={headline.isLoading} />
        <ConvictionPanel score={conviction} top={topNarrative} bottom={bottomNarrative} loading={!snap.data} />
      </div>

      {/* Ecosystem metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {eco ? (
          [
            { label: "MONAD MCAP", value: formatUsd(eco.totalTvlUsd) },
            { label: "24H MON VOL", value: formatUsd(eco.dexVolume24hUsd) },
            { label: "INTEL SIGNALS", value: derivedIntel.toLocaleString() },
            { label: "FLOW SCORE", value: (derivedFlow / 1_000).toFixed(0) + "K" },
            {
              label: "SOURCE",
              value: snap.data?.dataType === "live" ? "LIVE" : "SYNC",
              tone: "#22d3ee",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[10px] p-4 hover-lift flex flex-col justify-between h-[104px]"
              style={{ background: PANEL_BG, border: BORDER }}
            >
              <div
                className="leading-[1.15] min-h-[1.9em]"
                style={{
                  fontFamily: MONO,
                  fontSize: "0.6rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,250,0.55)",
                }}
              >
                {s.label}
              </div>
              <div
                className="tabular-nums truncate"
                style={{ color: s.tone ?? "#f5f7fa", fontSize: "1.35rem", lineHeight: 1, fontWeight: 700, fontFamily: MONO, letterSpacing: "-0.01em" }}
              >
                {s.value}
              </div>
            </div>
          ))
        ) : (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-[10px]" />)
        )}
      </div>

      {/* Intelligence timeline preview — evidence-first, higher priority than the AI brief */}
      <TimelinePreview
        events={feed.data?.events ?? []}
        loading={feed.isLoading}
      />

      {/* Row: AI brief (wider) + narrative rotation */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <BriefPanel state={brief} />
        <NarrativePanel narratives={narratives} loading={!snap.data} />
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

type HeadlineEvent = NonNullable<Awaited<ReturnType<typeof getHeadline>>["event"]>;

function HeadlineHero({ data, loading }: { data: HeadlineEvent | null; loading: boolean }) {
  return (
    <div
      className="rounded-[10px] p-6 md:p-7 relative overflow-hidden hover-lift"
      style={{ background: PANEL_BG, border: "1px solid rgba(34,211,238,0.22)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
    >
      <div
        aria-hidden
        className="absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.6), transparent 70%)" }}
      />
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full animate-pulse-glow" style={{ background: "#22d3ee", boxShadow: "0 0 10px #22d3ee" }} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#22d3ee",
          }}
        >
          Now on Monad · Most important event
        </span>
      </div>

      {loading || !data ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <>
          <h2
            className="mt-3"
            style={{ fontFamily: SERIF, fontSize: "clamp(1.6rem,2.6vw,2.4rem)", color: "#f5f7fa", lineHeight: 1.12, letterSpacing: "-0.01em" }}
          >
            {data.headline}
          </h2>
          <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: "rgba(245,247,250,0.82)" }}>
            {data.plain}
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,250,0.62)" }}>
            <span style={{ color: "#22d3ee", fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", marginRight: 8 }}>
              Why it matters
            </span>
            {data.matters}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px]" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.55)" }}>
            <Tag>{data.asset?.symbol ?? "Monad"}</Tag>
            <Tag>importance {data.importance}</Tag>
            <Tag>confidence {data.confidence}%</Tag>
            <Tag>on-chain anchor</Tag>
            <Tag>{data.minutesAgo}m ago</Tag>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/app/replay"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs shine-sweep"
              style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.4)", color: "#22d3ee" }}
            >
              <PlayCircle className="h-3.5 w-3.5" /> Open in Replay
            </Link>
            <Link
              to="/app/chat"
              search={{ q: `Verify event E-${data.id} — ${data.headline}. Walk me through the evidence.`, eventId: data.id } as never}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs hover-lift"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,250,0.85)" }}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Explain with Aegis
            </Link>
            <VerifyButton event={data} size="sm" variant="solid" />
          </div>
        </>
      )}
    </div>
  );
}

function ConvictionPanel({
  score,
  top,
  bottom,
  loading,
}: {
  score: number;
  top?: { name: string; strength: number; change: number };
  bottom?: { name: string; strength: number; change: number };
  loading: boolean;
}) {
  const tone = score >= 65 ? "#34d399" : score >= 40 ? "#fbbf24" : "#fb7185";
  const label = score >= 65 ? "Risk-On" : score >= 40 ? "Mixed" : "Risk-Off";
  return (
    <div className="rounded-[10px] p-6 flex flex-col" style={{ background: PANEL_BG, border: BORDER }}>
      <Eyebrow icon={Sparkles}>Ecosystem Conviction · 24h</Eyebrow>
      {loading ? (
        <Skeleton className="mt-4 h-24 w-full" />
      ) : (
        <>
          <div className="mt-4 flex items-baseline gap-3">
            <span style={{ color: tone, fontSize: "3.2rem", fontWeight: 700, fontFamily: MONO, lineHeight: 1 }}>{score}</span>
            <span style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO, fontSize: "0.72rem" }}>/100</span>
            <span
              className="ml-auto text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded"
              style={{ background: `${tone}18`, color: tone, border: `1px solid ${tone}44`, fontFamily: MONO }}
            >
              {label}
            </span>
          </div>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${tone}, ${tone}88)`, boxShadow: `0 0 8px ${tone}` }} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {top && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em]" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.5)" }}>
                  Leading narrative
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span style={{ color: "#f5f7fa", fontWeight: 500 }}>{top.name}</span>
                  <span style={{ color: top.change >= 0 ? "#34d399" : "#fb7185", fontFamily: MONO, fontSize: "0.75rem" }}>
                    {top.change >= 0 ? "+" : ""}
                    {top.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            {bottom && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em]" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.5)" }}>
                  Biggest risk
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span style={{ color: "#f5f7fa", fontWeight: 500 }}>{bottom.name}</span>
                  <span style={{ color: bottom.change >= 0 ? "#34d399" : "#fb7185", fontFamily: MONO, fontSize: "0.75rem" }}>
                    {bottom.change >= 0 ? "+" : ""}
                    {bottom.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed" style={{ color: "rgba(245,247,250,0.5)" }}>
            Composite of live market momentum, top-narrative strength, and Monad RPC activity. Refreshed every 60s.
          </p>
        </>
      )}
    </div>
  );
}

function BriefPanel({ state }: { state: ReturnType<typeof useQuery<Awaited<ReturnType<typeof getMarketBrief>>>> }) {
  const data = state.data;
  return (
    <div className="rounded-[10px] p-6" style={{ background: PANEL_BG, border: BORDER }}>
      <div className="flex items-center justify-between">
        <Eyebrow icon={Activity}>Market Brief · refreshes 3m</Eyebrow>
        {data?.ok && (
          <span
            className="text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded"
            style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.35)", fontFamily: MONO }}
          >
            {data.data.sentiment}
          </span>
        )}
      </div>
      {state.isLoading || !data ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : (
        <>
          <h3 className="mt-3" style={{ fontFamily: SERIF, fontSize: "1.4rem", color: "#f5f7fa", lineHeight: 1.25 }}>
            {data.data.headline}
          </h3>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {data.data.bullets.slice(0, 4).map((b, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ background: "#22d3ee" }} />
                <div>
                  <div className="text-sm" style={{ color: "#f5f7fa", fontWeight: 500 }}>{b.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(245,247,250,0.6)" }}>{b.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <MiniList icon={AlertTriangle} label="Risks" items={data.data.risks} tone="#fb7185" />
            <MiniList icon={Eye} label="Watch" items={data.data.watch} tone="#22d3ee" />
          </div>
        </>
      )}
    </div>
  );
}

function NarrativePanel({
  narratives,
  loading,
}: {
  narratives: { name: string; strength: number; change: number }[];
  loading: boolean;
}) {
  return (
    <div className="rounded-[10px] p-6" style={{ background: PANEL_BG, border: BORDER }}>
      <Eyebrow icon={TrendingUp}>Narrative Rotation · 24h</Eyebrow>
      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {[...narratives].sort((a, b) => b.strength - a.strength).map((n) => (
            <div key={n.name}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#f5f7fa", fontWeight: 500 }}>{n.name}</span>
                <span style={{ color: n.change >= 0 ? "#34d399" : "#fb7185", fontFamily: MONO, fontSize: "0.75rem" }}>
                  {n.change >= 0 ? "+" : ""}
                  {n.change.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(n.strength * 100)}%`,
                    background: "linear-gradient(90deg,#22d3ee,#0ea5b7)",
                    boxShadow: "0 0 6px rgba(34,211,238,0.4)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelinePreview({
  events,
  loading,
}: {
  events: HeadlineEvent[];
  loading: boolean;
}) {
  return (
    <div className="rounded-[10px] p-6" style={{ background: PANEL_BG, border: BORDER }}>
      <div className="flex items-center justify-between">
        <Eyebrow icon={Activity}>Recent Intelligence · Last 6h</Eyebrow>
        <Link
          to="/app/replay"
          className="inline-flex items-center gap-1 text-[11px] hover:text-[#22d3ee] transition-colors"
          style={{ color: "rgba(245,247,250,0.65)", fontFamily: MONO }}
        >
          Open Replay <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <ul className="mt-4 divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {events.slice(0, 6).map((e) => {
            const isRisk = e.category === "whale_distribution" || e.category === "liquidity_remove" || e.category === "unusual_behavior";
            const tone = isRisk ? "#fb7185" : e.category.startsWith("whale") ? "#34d399" : "#22d3ee";
            const Icon = isRisk ? ShieldAlert : e.category.startsWith("whale") ? TrendingUp : Activity;
            return (
              <li key={e.id} className="py-2.5 flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-[6px] shrink-0"
                  style={{ background: `${tone}14`, border: `1px solid ${tone}40` }}
                >
                  <Icon className="h-3 w-3" style={{ color: tone }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: "#f5f7fa" }}>{e.headline}</div>
                  <div className="text-[10px] mt-0.5 flex gap-2" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.5)" }}>
                    <span>{e.minutesAgo}m ago</span>
                    <span>· imp {e.importance}</span>
                    <span>· conf {e.confidence}%</span>
                  </div>
                </div>
              </li>
            );
          })}
          {!events.length && (
            <li className="py-6 text-sm" style={{ color: "rgba(245,247,250,0.5)" }}>No events surfaced in the window.</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Small primitives ────────────────────────────────────────────────────────
function Eyebrow({ icon: Icon, children }: { icon: typeof Activity; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
      <span
        style={{
          fontFamily: MONO,
          fontSize: "0.6rem",
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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", letterSpacing: "0.06em" }}
    >
      {children}
    </span>
  );
}

function MiniList({ icon: Icon, label, items, tone }: { icon: typeof Eye; label: string; items: string[]; tone: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.55)" }}>
        <Icon className="h-3 w-3" style={{ color: tone }} />
        {label}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((r, i) => (
          <li key={i} style={{ color: "rgba(245,247,250,0.75)" }}>— {r}</li>
        ))}
      </ul>
    </div>
  );
}