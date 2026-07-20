import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEventFeed } from "@/lib/intelligence.functions";
import { useMemo, useState } from "react";
import { getReplayWindow } from "@/lib/monad-events";
import {
  Activity,
  Waves,
  Droplets,
  Zap,
  ArrowLeftRight,
  Layers,
  Users,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  Filter,
  ExternalLink,
  MessageSquare,
  PlayCircle,
  Clock,
} from "lucide-react";
import type { MonadEvent, EventCategory } from "@/lib/monad-events";
import { VerifyButton } from "@/components/aegis/verify-button";
import { ACTIVE_MONAD } from "@/lib/monad-wallet";
const EXPLORER = ACTIVE_MONAD.blockExplorerUrls[0];

export const Route = createFileRoute("/app/timeline")({
  component: TimelinePage,
});

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";
const BORDER = "1px solid rgba(34,211,238,0.14)";
const PANEL_BG = "linear-gradient(180deg, rgba(10,18,28,0.65), rgba(4,10,16,0.65))";

const CAT_META: Record<EventCategory, { label: string; icon: typeof Waves; color: string; bucket: FilterKey }> = {
  whale_accumulation: { label: "Whale Accumulation", icon: TrendingUp, color: "#34d399", bucket: "whales" },
  whale_distribution: { label: "Whale Distribution", icon: TrendingDown, color: "#fb7185", bucket: "whales" },
  large_transfer: { label: "Large Transfer", icon: ArrowLeftRight, color: "#22d3ee", bucket: "whales" },
  stable_flow: { label: "Stable Flow", icon: Waves, color: "#a78bfa", bucket: "flow" },
  liquidity_add: { label: "Liquidity Add", icon: Droplets, color: "#34d399", bucket: "liquidity" },
  liquidity_remove: { label: "Liquidity Remove", icon: Droplets, color: "#fb7185", bucket: "liquidity" },
  dex_volume_spike: { label: "DEX Volume Spike", icon: Zap, color: "#fbbf24", bucket: "protocols" },
  protocol_activity: { label: "Protocol Activity", icon: Layers, color: "#22d3ee", bucket: "protocols" },
  coordinated_wallets: { label: "Coordinated Cluster", icon: Users, color: "#f59e0b", bucket: "opportunities" },
  capital_rotation: { label: "Capital Rotation", icon: Sparkles, color: "#a78bfa", bucket: "opportunities" },
  new_wallet_wave: { label: "New Wallet Wave", icon: Users, color: "#22d3ee", bucket: "protocols" },
  unusual_behavior: { label: "Anomaly", icon: ShieldAlert, color: "#fb7185", bucket: "risks" },
};

type FilterKey = "all" | "whales" | "liquidity" | "flow" | "protocols" | "opportunities" | "risks";
const FILTERS: { k: FilterKey; label: string }[] = [
  { k: "all", label: "All" },
  { k: "whales", label: "Transfers" },
  { k: "liquidity", label: "Liquidity" },
  { k: "flow", label: "Flow" },
  { k: "protocols", label: "Blocks" },
  { k: "opportunities", label: "Opportunities" },
  { k: "risks", label: "Risks" },
];

// Risk categories add a bonus to "risks" bucket beyond their natural bucket.
const RISK_CATS: EventCategory[] = ["whale_distribution", "liquidity_remove", "unusual_behavior"];

function fmtAgo(mins: number) {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = mins / 60;
  return h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
}

function usd(n?: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function TimelinePage() {
  const [hours, setHours] = useState<1 | 6 | 24>(6);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fn = useServerFn(getEventFeed);
  const q = useQuery({
    queryKey: ["timeline", hours],
    queryFn: () => fn({ data: { windowHours: hours, limit: hours === 1 ? 97 : hours === 6 ? 137 : 199 } }),
    staleTime: 45_000,
    refetchInterval: 60_000,
    // Never show a blank page — hydrate instantly with a deterministic
    // client-side synthetic window (same MonadEvent shape). Real RPC data
    // replaces this as soon as the server function resolves.
    placeholderData: () => {
      const seed = getReplayWindow(hours, Date.now(), hours === 1 ? 97 : hours === 6 ? 137 : 199);
      return { ...seed, source: "seed", dataType: "curated" as const, blocksScanned: 0 } as never;
    },
  });

  // Suppress zero-notional entries — they read as "$0.0000" cards and add no
  // value. Real transfers with zero MON value and synthetic events that
  // rounded to $0 both get dropped here.
  const events = (q.data?.events ?? []).filter((e) => (e.amountUsd ?? 0) > 0 || e.category === "protocol_activity" || e.category === "new_wallet_wave");

  // Rank: recency × importance × evidence quality (evidence count) × confidence × unusualness bonus
  const ranked = useMemo(() => {
    const scored = events
      .map((e) => {
        const evidenceQ = Math.min(1, e.evidence.length / 5);
        const recency = 1 / (Math.log(e.minutesAgo + 2) + 1);
        const score =
          e.importance * 0.35 +
          e.confidence * 0.25 +
          e.unusualness * 0.15 +
          evidenceQ * 100 * 0.15 +
          recency * 100 * 0.10;
        return { e, score };
      });
    // Real (on-chain verifiable) events always rank above synthetic ones.
    // Within each bucket, sort by score. This guarantees the top of the
    // timeline is 100% real, verifiable events; synthetic pattern signals
    // sit below purely to increase density.
    return scored.sort((a, b) => {
      const ar = a.e.isReal ? 1 : 0;
      const br = b.e.isReal ? 1 : 0;
      if (ar !== br) return br - ar;
      return b.score - a.score;
    });
  }, [events]);

  const filtered = useMemo(() => {
    if (filter === "all") return ranked;
    return ranked.filter(({ e }) => {
      if (filter === "risks") return RISK_CATS.includes(e.category);
      return CAT_META[e.category].bucket === filter;
    });
  }, [ranked, filter]);

  const selected =
    events.find((e) => e.id === selectedId) ?? filtered[0]?.e ?? null;

  // Category counts for the filter chips
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, whales: 0, liquidity: 0, flow: 0, protocols: 0, opportunities: 0, risks: 0 };
    events.forEach((e) => {
      c.all++;
      c[CAT_META[e.category].bucket]++;
      if (RISK_CATS.includes(e.category)) c.risks++;
    });
    return c;
  }, [events]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-10 pt-4 md:pt-6 pb-8 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div style={eyebrowStyle}>// MONAD · INTELLIGENCE NEWSROOM</div>
          <h1 className="mt-2" style={{ fontFamily: SERIF, fontSize: "clamp(2rem,4vw,3rem)", color: "#f5f7fa", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Intelligence <em style={{ color: "#22d3ee" }}>Timeline</em>
          </h1>
          <p className="mt-2 text-sm max-w-2xl" style={{ color: "rgba(245,247,250,0.65)" }}>
            Curated pattern signals ranked by impact, confidence, and recency. Notionals are conservative estimates — verifiable on-chain transactions live in the Live On-Chain panel on the dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" style={{ color: "rgba(245,247,250,0.5)" }} />
            {[1, 6, 24].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h as 1 | 6 | 24)}
                className="px-2 py-1 rounded text-[11px] transition-all"
                style={{
                  background: hours === h ? "rgba(34,211,238,0.12)" : "transparent",
                  color: hours === h ? "#22d3ee" : "rgba(245,247,250,0.55)",
                  border: hours === h ? "1px solid rgba(34,211,238,0.35)" : "1px solid transparent",
                  fontFamily: MONO,
                }}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5" style={{ color: "rgba(245,247,250,0.4)" }} />
        {FILTERS.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.14em] transition-all flex items-center gap-1.5"
            style={{
              fontFamily: MONO,
              background: filter === f.k ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.02)",
              color: filter === f.k ? "#22d3ee" : "rgba(245,247,250,0.6)",
              border: `1px solid ${filter === f.k ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {f.label}
            <span style={{ color: "rgba(245,247,250,0.4)", fontSize: "0.65rem" }}>{counts[f.k]}</span>
          </button>
        ))}
      </div>

      {/* Split view */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Feed */}
        <div className="rounded-[10px]" style={{ background: PANEL_BG, border: BORDER }}>
          <div className="max-h-[calc(100vh-260px)] min-h-[520px] overflow-y-auto divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {q.isLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-white/5" />
                <div className="mt-2 h-3 w-full rounded bg-white/5" />
              </div>
            ))}
            {!q.isLoading && filtered.map(({ e, score }) => (
              <EventCard
                key={e.id}
                e={e}
                selected={e.id === (selected?.id ?? null)}
                score={score}
                onSelect={() => setSelectedId(e.id)}
              />
            ))}
            {!q.isLoading && !filtered.length && (
              <div className="p-6 text-sm" style={{ color: "rgba(245,247,250,0.5)" }}>
                No events match this filter in the {hours}h window.
              </div>
            )}
          </div>
        </div>

        {/* Inspector */}
        <div className="rounded-[10px] p-6 sticky top-4 self-start" style={{ background: PANEL_BG, border: BORDER }}>
          {selected ? <Inspector e={selected} /> : (
            <div className="text-sm" style={{ color: "rgba(245,247,250,0.55)" }}>
              Select an event to see block evidence and why it matters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Event card ─────────────────────────────────────────────────────────────
function EventCard({
  e,
  selected,
  score,
  onSelect,
}: {
  e: MonadEvent;
  selected: boolean;
  score: number;
  onSelect: () => void;
}) {
  const meta = CAT_META[e.category];
  const Icon = meta.icon;
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 md:p-5 transition-all hover:bg-[rgba(34,211,238,0.045)] hover:-translate-y-px"
      style={{
        background: selected ? "rgba(34,211,238,0.05)" : "transparent",
        borderLeft: selected ? `2px solid ${meta.color}` : "2px solid transparent",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-[6px] shrink-0"
          style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}44` }}
        >
          <Icon className="h-4 w-4" style={{ color: meta.color }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
              style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}30`, fontFamily: MONO }}
            >
              {meta.label}
            </span>
            {e.asset && (
              <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.5)", fontFamily: MONO }}>
                {e.asset.symbol} · {e.asset.narrative}
              </span>
            )}
            <span className="ml-auto text-[10px]" style={{ color: "rgba(245,247,250,0.45)", fontFamily: MONO }}>
              rank {Math.round(score)}
            </span>
          </div>
          <div className="mt-1.5 text-[15px] leading-snug" style={{ color: "#f5f7fa" }}>
            {e.headline}
          </div>
          <div className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(245,247,250,0.62)" }}>
            {e.plain}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px]" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.5)" }}>
            <span>{fmtAgo(e.minutesAgo)} ago</span>
            <span style={{ color: e.isReal ? "#34d399" : "rgba(245,247,250,0.5)" }}>
              {e.isReal ? "live RPC · verifiable" : "pattern signal"}
            </span>
            <span style={{ color: meta.color }}>imp {e.importance}</span>
            <span>conf {e.confidence}%</span>
            {e.amountUsd ? <span>{usd(e.amountUsd)}</span> : null}
            <span className="ml-auto" onClick={(ev) => ev.stopPropagation()}>
              <VerifyButton event={e} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Inspector (shared shape with replay for consistency) ───────────────────
function Inspector({ e }: { e: MonadEvent }) {
  const meta = CAT_META[e.category];
  const Icon = meta.icon;
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] shrink-0"
          style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}55` }}
        >
          <Icon className="h-5 w-5" style={{ color: meta.color }} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded"
              style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}44`, fontFamily: MONO }}
            >
              {meta.label}
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.4)", fontFamily: MONO }}>
              live RPC · {fmtAgo(e.minutesAgo)} ago
            </span>
          </div>
          <h2 className="mt-1.5" style={{ fontFamily: SERIF, fontSize: "1.5rem", color: "#f5f7fa", lineHeight: 1.15 }}>
            {e.headline}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Score label="Importance" v={e.importance} color="#22d3ee" />
        <Score label="Confidence" v={e.confidence} color="#34d399" />
        <Score label="Unusualness" v={e.unusualness} color="#a78bfa" />
      </div>

      <Section title="What happened">{e.plain}</Section>
      <Section title="Why it matters">{e.matters}</Section>
      <Section title="Watch next">{e.watchNext}</Section>
      <Section title="Uncertainty">{e.uncertainty}</Section>

      <div>
        <SectionTitle>Evidence</SectionTitle>
        <div className="mt-2 grid gap-1.5">
          {e.evidence.map((ev) => {
            const href = e.isReal && ev.ref ? `${EXPLORER}${ev.ref}` : null;
            const inner = (
              <>
                <span className="uppercase tracking-[0.12em] text-[10px]" style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO }}>
                  {ev.label}
                </span>
                <span className="flex items-center gap-2" style={{ fontFamily: MONO, color: href ? "#22d3ee" : "#f5f7fa" }}>
                  {ev.value}
                  {href && <ExternalLink className="h-3 w-3 opacity-70" />}
                </span>
              </>
            );
            const cls = "flex items-center justify-between text-xs px-3 py-2 rounded-[6px] transition-colors";
            const style = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" };
            return href ? (
              <a key={ev.id} href={href} target="_blank" rel="noreferrer" className={`${cls} hover:bg-white/5`} style={style}>
                {inner}
              </a>
            ) : (
              <div key={ev.id} className={cls} style={style}>{inner}</div>
            );
          })}
        </div>
      </div>

      {e.wallets.length > 0 && (
        <div>
          <SectionTitle>Wallets</SectionTitle>
          <div className="mt-2 space-y-1.5">
            {e.wallets.map((w, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <Link
                  to="/app/wallet"
                  search={{ address: w.address } as never}
                  className="hover:text-[#22d3ee] transition-colors"
                  style={{ fontFamily: MONO, color: "#22d3ee" }}
                >
                  {w.address.slice(0, 8)}…{w.address.slice(-6)}
                </Link>
                <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO }}>
                  {w.label ? `${w.label} · ` : ""}{w.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {e.tags.map((t) => (
          <span key={t} className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.03)", color: "rgba(245,247,250,0.6)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: MONO }}>
            {t}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          to="/app/chat"
          search={{ q: `Verify event E-${e.id} — walk me through the evidence and what to watch next.`, eventId: e.id } as never}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs shine-sweep"
          style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.4)", color: "#22d3ee" }}
        >
          <MessageSquare className="h-3.5 w-3.5" /> Explain with Aegis
        </Link>
        <VerifyButton event={e} />
        <Link
          to="/app/replay"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs hover-lift"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,250,0.85)" }}
        >
          <PlayCircle className="h-3.5 w-3.5" /> Open in Replay
        </Link>
      </div>
    </div>
  );
}

function Score({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div className="rounded-[8px] p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: "rgba(245,247,250,0.5)", fontFamily: MONO }}>{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="tabular-nums" style={{ color, fontSize: "1.35rem", fontWeight: 700, fontFamily: MONO }}>{v}</span>
        <span className="text-[10px]" style={{ color: "rgba(245,247,250,0.4)", fontFamily: MONO }}>/100</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "rgba(245,247,250,0.82)" }}>{children}</p>
    </div>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: "0.66rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(245,247,250,0.55)",
};