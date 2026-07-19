import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReplayFeed } from "@/lib/intelligence.functions";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  Clock,
  Radio,
  ExternalLink,
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
  Activity,
} from "lucide-react";
import type { MonadEvent, EventCategory } from "@/lib/monad-events";

export const Route = createFileRoute("/app/replay")({ component: ReplayPage });

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";
const BORDER = "1px solid rgba(34,211,238,0.14)";
const PANEL_BG = "linear-gradient(180deg, rgba(10,18,28,0.65), rgba(4,10,16,0.65))";

const CAT_META: Record<EventCategory, { label: string; icon: typeof Waves; color: string }> = {
  whale_accumulation: { label: "Whale Accumulation", icon: TrendingUp, color: "#34d399" },
  whale_distribution: { label: "Whale Distribution", icon: TrendingDown, color: "#fb7185" },
  large_transfer: { label: "Large Transfer", icon: ArrowLeftRight, color: "#22d3ee" },
  stable_flow: { label: "Stable Flow", icon: Waves, color: "#a78bfa" },
  liquidity_add: { label: "Liquidity Add", icon: Droplets, color: "#34d399" },
  liquidity_remove: { label: "Liquidity Remove", icon: Droplets, color: "#fb7185" },
  dex_volume_spike: { label: "DEX Volume Spike", icon: Zap, color: "#fbbf24" },
  protocol_activity: { label: "Protocol Activity", icon: Layers, color: "#22d3ee" },
  coordinated_wallets: { label: "Coordinated Cluster", icon: Users, color: "#f59e0b" },
  capital_rotation: { label: "Capital Rotation", icon: Sparkles, color: "#a78bfa" },
  new_wallet_wave: { label: "New Wallet Wave", icon: Users, color: "#22d3ee" },
  unusual_behavior: { label: "Anomaly", icon: ShieldAlert, color: "#fb7185" },
};

const SPEEDS = [1, 2, 4, 8, 16] as const;
type Speed = (typeof SPEEDS)[number];

function fmtClock(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function fmtAgo(mins: number) {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${(mins / 60).toFixed(1)}h ago`;
}

function ReplayPage() {
  const [hours, setHours] = useState<1 | 6 | 24>(6);
  const fn = useServerFn(getReplayFeed);
  const q = useQuery({
    queryKey: ["replay", hours],
    queryFn: () => fn({ data: { hours } }),
    staleTime: 60_000,
  });

  const events = q.data?.events ?? [];
  const startTs = q.data?.startTs ?? Date.now() - hours * 3600_000;
  const endTs = q.data?.endTs ?? Date.now();
  const windowMs = endTs - startTs || 1;

  // Playhead in real-time ms since startTs
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "whales" | "liquidity" | "flow" | "protocols" | "risk">("all");

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Reset playhead when window changes
  useEffect(() => {
    setPlayhead(0);
    setSelectedId(null);
  }, [hours, q.data?.generatedAt]);

  // Auto-select the most-important visible event
  useEffect(() => {
    if (selectedId || !events.length) return;
    const cursor = startTs + playhead;
    const visible = events.filter((e) => e.ts <= cursor);
    if (!visible.length) return;
    const top = visible.slice().sort((a, b) => b.importance - a.importance)[0];
    setSelectedId(top.id);
  }, [events, startTs, playhead, selectedId]);

  // Playback loop (real-wall-time * speed, mapped onto windowMs)
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    // 1 real second = (windowMs / 30) * speed / speed_base advancement.
    // We just want the whole 6h window to replay in ~30s at 1x, 15s at 2x, etc.
    const baseDuration = 30_000; // 1x runs the whole window in 30s
    lastTickRef.current = performance.now();
    const step = (t: number) => {
      const dt = t - lastTickRef.current;
      lastTickRef.current = t;
      setPlayhead((prev) => {
        const next = prev + (dt * speed * windowMs) / baseDuration;
        if (next >= windowMs) {
          setPlaying(false);
          return windowMs;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, windowMs]);

  const cursorTs = startTs + playhead;
  const revealed = useMemo(() => events.filter((e) => e.ts <= cursorTs), [events, cursorTs]);
  const filtered = useMemo(() => {
    if (filter === "all") return revealed;
    const map: Record<string, EventCategory[]> = {
      whales: ["whale_accumulation", "whale_distribution", "large_transfer", "coordinated_wallets"],
      liquidity: ["liquidity_add", "liquidity_remove"],
      flow: ["stable_flow", "capital_rotation"],
      protocols: ["protocol_activity", "dex_volume_spike", "new_wallet_wave"],
      risk: ["whale_distribution", "liquidity_remove", "unusual_behavior"],
    };
    return revealed.filter((e) => map[filter]?.includes(e.category));
  }, [revealed, filter]);

  const selected = useMemo(
    () => events.find((e) => e.id === selectedId) ?? filtered[filtered.length - 1] ?? null,
    [events, selectedId, filtered],
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-10 pt-4 md:pt-6 pb-8 space-y-6">
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
            // MONAD · FLAGSHIP TIMELINE
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
            Replay the <em style={{ color: "#22d3ee" }}>Chain</em>
          </h1>
          <p className="mt-2 text-sm max-w-2xl" style={{ color: "rgba(245,247,250,0.65)" }}>
            Scrub through the last {hours} hour{hours === 1 ? "" : "s"} of Monad. Every event carries evidence — tx, block,
            wallets, and why it matters. Curated demo dataset, live-swappable.
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
            {events.length} events · curated
          </span>
        </div>
      </header>

      {/* Transport controls */}
      <div
        className="rounded-[10px] p-4 md:p-5"
        style={{ background: PANEL_BG, border: BORDER }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-medium transition-all shine-sweep hover-lift"
            style={{
              background: playing ? "rgba(251,113,133,0.12)" : "rgba(34,211,238,0.12)",
              border: `1px solid ${playing ? "rgba(251,113,133,0.4)" : "rgba(34,211,238,0.4)"}`,
              color: playing ? "#fb7185" : "#22d3ee",
            }}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              setPlayhead(0);
              setSelectedId(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs transition-colors hover:bg-white/[0.03]"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,250,0.75)" }}
          >
            <Rewind className="h-3.5 w-3.5" /> Reset
          </button>

          <div className="flex items-center gap-1 ml-2">
            <FastForward className="h-3.5 w-3.5" style={{ color: "rgba(245,247,250,0.5)" }} />
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-2 py-1 rounded text-[11px] transition-all"
                style={{
                  background: speed === s ? "rgba(34,211,238,0.12)" : "transparent",
                  color: speed === s ? "#22d3ee" : "rgba(245,247,250,0.55)",
                  border: speed === s ? "1px solid rgba(34,211,238,0.35)" : "1px solid transparent",
                  fontFamily: MONO,
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-2">
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

          <div className="ml-auto flex items-center gap-2">
            <span style={{ fontFamily: MONO, fontSize: "0.72rem", color: "rgba(245,247,250,0.55)" }}>
              {fmtClock(cursorTs)}
            </span>
            <span style={{ fontFamily: MONO, fontSize: "0.66rem", color: "#22d3ee" }}>
              {revealed.length}/{events.length}
            </span>
          </div>
        </div>

        {/* Timeline scrubber + event lollipops */}
        <div className="mt-4">
          <div className="relative h-16 select-none">
            {/* baseline */}
            <div
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
              style={{ background: "rgba(34,211,238,0.18)" }}
            />
            {/* lollipops */}
            {events.map((e) => {
              const pct = ((e.ts - startTs) / windowMs) * 100;
              const revealedNow = e.ts <= cursorTs;
              const meta = CAT_META[e.category];
              const h = 6 + (e.importance / 100) * 26;
              const isSelected = e.id === selectedId;
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedId(e.id);
                    setPlayhead(e.ts - startTs);
                    setPlaying(false);
                  }}
                  className="absolute -translate-x-1/2 top-1/2 group"
                  style={{ left: `${pct}%` }}
                  title={e.headline}
                >
                  <span
                    className="block w-px mx-auto"
                    style={{
                      height: h,
                      background: revealedNow ? meta.color : "rgba(255,255,255,0.12)",
                      transform: "translateY(-100%)",
                      opacity: revealedNow ? 0.9 : 0.45,
                    }}
                  />
                  <span
                    className="block rounded-full mx-auto transition-all"
                    style={{
                      width: isSelected ? 8 : 5,
                      height: isSelected ? 8 : 5,
                      background: revealedNow ? meta.color : "rgba(255,255,255,0.25)",
                      boxShadow: revealedNow ? `0 0 8px ${meta.color}` : "none",
                      transform: "translateY(-50%)",
                    }}
                  />
                </button>
              );
            })}
            {/* Playhead */}
            <input
              type="range"
              min={0}
              max={windowMs}
              step={1000}
              value={playhead}
              onChange={(e) => {
                setPlayhead(Number(e.target.value));
                setPlaying(false);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              aria-label="Scrub timeline"
            />
            <div
              className="absolute top-0 bottom-0 w-[2px] pointer-events-none"
              style={{
                left: `${(playhead / windowMs) * 100}%`,
                background: "#22d3ee",
                boxShadow: "0 0 10px rgba(34,211,238,0.9)",
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px]" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.4)" }}>
            <span>{fmtClock(startTs)}</span>
            <span>{fmtClock(startTs + windowMs / 2)}</span>
            <span>{fmtClock(endTs)}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "whales", "liquidity", "flow", "protocols", "risk"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.14em] transition-all"
            style={{
              fontFamily: MONO,
              background: filter === f ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.02)",
              color: filter === f ? "#22d3ee" : "rgba(245,247,250,0.6)",
              border: `1px solid ${filter === f ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Split: event stream + inspector */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Stream */}
        <div className="rounded-[10px]" style={{ background: PANEL_BG, border: BORDER }}>
          <div className="p-4 border-b" style={{ borderColor: "rgba(34,211,238,0.12)" }}>
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} />
              <span style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
                Event Stream · {filtered.length}
              </span>
            </div>
          </div>
          <div className="max-h-[560px] overflow-y-auto divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {filtered.slice().reverse().map((e) => (
              <EventRow key={e.id} e={e} selected={e.id === selectedId} onSelect={() => setSelectedId(e.id)} />
            ))}
            {!filtered.length && (
              <div className="p-6 text-sm" style={{ color: "rgba(245,247,250,0.5)" }}>
                {revealed.length ? "No events match this filter yet." : "Press play or scrub to reveal events."}
              </div>
            )}
          </div>
        </div>

        {/* Inspector */}
        <div className="rounded-[10px] p-5" style={{ background: PANEL_BG, border: BORDER }}>
          {selected ? <Inspector e={selected} /> : (
            <div className="text-sm" style={{ color: "rgba(245,247,250,0.55)" }}>
              Select an event to inspect evidence, wallets, and why it matters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ e, selected, onSelect }: { e: MonadEvent; selected: boolean; onSelect: () => void }) {
  const meta = CAT_META[e.category];
  const Icon = meta.icon;
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
      style={{
        background: selected ? "rgba(34,211,238,0.05)" : "transparent",
        borderLeft: selected ? `2px solid ${meta.color}` : "2px solid transparent",
      }}
    >
      <span
        className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-[6px] shrink-0"
        style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}44` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: "#f5f7fa", fontSize: "0.86rem", fontWeight: 500 }}>{e.headline}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[10px]" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.5)" }}>
          <span>{fmtAgo(e.minutesAgo)}</span>
          <span>· blk {e.block.toLocaleString()}</span>
          <span style={{ color: meta.color }}>· imp {e.importance}</span>
          <span>· conf {e.confidence}%</span>
        </div>
      </div>
    </button>
  );
}

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
              curated · {fmtAgo(e.minutesAgo)}
            </span>
          </div>
          <h2 className="mt-1.5" style={{ fontFamily: SERIF, fontSize: "1.5rem", color: "#f5f7fa", lineHeight: 1.15 }}>
            {e.headline}
          </h2>
        </div>
      </div>

      {/* Scores */}
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
          {e.evidence.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center justify-between text-xs px-3 py-2 rounded-[6px]"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span className="uppercase tracking-[0.12em] text-[10px]" style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO }}>
                {ev.label}
              </span>
              <span className="flex items-center gap-2" style={{ fontFamily: MONO, color: "#f5f7fa" }}>
                {ev.value}
                {ev.ref && <ExternalLink className="h-3 w-3 opacity-50" />}
              </span>
            </div>
          ))}
        </div>
      </div>

      {e.wallets.length > 0 && (
        <div>
          <SectionTitle>Wallets</SectionTitle>
          <div className="mt-2 space-y-1.5">
            {e.wallets.map((w, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span style={{ fontFamily: MONO, color: "#22d3ee" }}>
                  {w.address.slice(0, 8)}…{w.address.slice(-6)}
                </span>
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
          <span
            key={t}
            className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.03)", color: "rgba(245,247,250,0.6)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: MONO }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <a
          href={`/app/chat?q=${encodeURIComponent("Explain this event and what to watch next.")}&eventId=${encodeURIComponent(e.id)}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs shine-sweep"
          style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.4)", color: "#22d3ee" }}
        >
          <Activity className="h-3.5 w-3.5" /> Explain with Aegis
        </a>
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