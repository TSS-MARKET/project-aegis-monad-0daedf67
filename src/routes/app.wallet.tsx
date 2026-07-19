import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeWallet } from "@/lib/intelligence.functions";
import {
  computeWalletDNA,
  isMonadAddress,
  synthesizeHoldings,
  type WalletDNA,
} from "@/lib/wallet-dna";
import { Fingerprint, Search, Copy, MessageSquare, Newspaper, ShieldAlert, Sparkles } from "lucide-react";

const searchSchema = z.object({ address: z.string().optional() });

export const Route = createFileRoute("/app/wallet")({
  component: WalletDNAPage,
  validateSearch: (s) => searchSchema.parse(s),
});

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";
const BORDER = "1px solid rgba(34,211,238,0.14)";
const PANEL_BG = "linear-gradient(180deg, rgba(10,18,28,0.65), rgba(4,10,16,0.65))";
const CYAN = "#22d3ee";

const SAMPLE_ADDRESSES = [
  "0x8a3e7d02f1e5b6c9d4a2f8b1e4c7d5a6b9e2f3c8", // whale-ish
  "0x2f9c5b1a7d3e8f4c6b2a9d0e1f5c3b7a8d4e6f2c", // meme hunter
  "0x71b4c8a2e5f9d3b6a1c7e4f8b0d2a5c9e3f1b8d7", // lp rotator
];

function WalletDNAPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [input, setInput] = useState(search.address ?? "");
  const activeAddress = (search.address ?? "").trim().toLowerCase();
  const valid = isMonadAddress(activeAddress);

  useEffect(() => setInput(search.address ?? ""), [search.address]);

  function submit(addr: string) {
    const a = addr.trim();
    if (!a) return;
    navigate({ search: { address: a }, replace: true });
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-10 pt-4 md:pt-6 pb-8 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div style={eyebrow}>// MONAD · WALLET DNA</div>
          <h1 className="mt-2" style={{ fontFamily: SERIF, fontSize: "clamp(2rem,4vw,3rem)", color: "#f5f7fa", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Wallet <em style={{ color: CYAN }}>DNA</em>
          </h1>
          <p className="mt-2 text-sm max-w-2xl" style={{ color: "rgba(245,247,250,0.65)" }}>
            Behavioral fingerprint for any Monad address. Archetype, rhythm, category split, narrative exposure, conviction, and cohort — deterministic, evidence-first.
          </p>
        </div>
      </header>

      {/* Address bar */}
      <div className="rounded-[10px] p-3 md:p-4 flex flex-wrap items-center gap-2" style={{ background: PANEL_BG, border: BORDER }}>
        <Search className="h-4 w-4 shrink-0" style={{ color: "rgba(245,247,250,0.5)" }} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(input)}
          placeholder="0x… paste any Monad address"
          className="flex-1 min-w-[240px] bg-transparent outline-none text-sm"
          style={{ fontFamily: MONO, color: "#f5f7fa" }}
        />
        <button
          onClick={() => submit(input)}
          className="px-4 py-2 rounded-[6px] text-xs shine-sweep"
          style={{ background: "rgba(34,211,238,0.14)", border: `1px solid ${CYAN}66`, color: CYAN, fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          Sequence DNA
        </button>
        <div className="w-full flex flex-wrap gap-2 pt-1">
          <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.45)", fontFamily: MONO }}>Try:</span>
          {SAMPLE_ADDRESSES.map((a) => (
            <button
              key={a}
              onClick={() => submit(a)}
              className="text-[11px] px-2 py-0.5 rounded-full hover:text-[#22d3ee] transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", color: "rgba(245,247,250,0.65)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: MONO }}
            >
              {a.slice(0, 8)}…{a.slice(-6)}
            </button>
          ))}
        </div>
      </div>

      {!activeAddress && <EmptyState />}
      {activeAddress && !valid && (
        <div className="rounded-[10px] p-6 text-sm" style={{ background: PANEL_BG, border: BORDER, color: "rgba(245,247,250,0.7)" }}>
          <span style={{ fontFamily: MONO, color: "#fb7185" }}>Invalid address.</span> Expected a 0x-prefixed 40-char hex string.
        </div>
      )}
      {valid && <DNAReport address={activeAddress} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[10px] p-10 text-center" style={{ background: PANEL_BG, border: BORDER }}>
      <Fingerprint className="mx-auto h-8 w-8" style={{ color: CYAN }} />
      <h2 className="mt-4 text-xl" style={{ fontFamily: SERIF, color: "#f5f7fa" }}>Sequence any wallet's DNA</h2>
      <p className="mt-2 text-sm max-w-lg mx-auto" style={{ color: "rgba(245,247,250,0.62)" }}>
        Paste a Monad address above. Aegis renders a stable, deterministic fingerprint — the same address always produces the same DNA.
      </p>
    </div>
  );
}

function DNAReport({ address }: { address: string }) {
  const dna = useMemo(() => computeWalletDNA(address), [address]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-6">
        <IdentityCard dna={dna} />
        <RhythmCard dna={dna} />
        <ActivityMixCard dna={dna} />
      </div>
      <div className="space-y-6">
        <ConvictionCard dna={dna} />
        <NarrativeCard dna={dna} />
        <RiskCard dna={dna} />
        <CohortCard dna={dna} />
        <AIStrategistCard dna={dna} />
      </div>
    </div>
  );
}

// ── Panels ─────────────────────────────────────────────────────────────────

function IdentityCard({ dna }: { dna: WalletDNA }) {
  const a = dna.archetype;
  return (
    <Panel>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div style={eyebrow}>// IDENTITY</div>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
              style={{ background: `${a.color}18`, border: `1px solid ${a.color}55`, color: a.color, fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              <Fingerprint className="h-3.5 w-3.5" /> {a.label}
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO }}>
              {a.tag} · seen since {dna.seenSince}
            </span>
          </div>
          <h2 className="mt-3" style={{ fontFamily: SERIF, fontSize: "1.9rem", color: "#f5f7fa", lineHeight: 1.15 }}>
            {a.blurb}
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(dna.address)}
              className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded hover:text-[#22d3ee]"
              style={{ fontFamily: MONO, color: "rgba(245,247,250,0.7)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              title="Copy"
            >
              {dna.address} <Copy className="h-3 w-3" />
            </button>
            <span className="text-[11px]" style={{ fontFamily: MONO, color: CYAN }}>{dna.fingerprint}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-6 gap-2">
        <Stat label="Balance" value={usd(dna.stats.balanceUsd)} />
        <Stat label="30d P&L" value={usd(dna.stats.pnl30d)} tone={dna.stats.pnl30d >= 0 ? "up" : "down"} />
        <Stat label="Win rate" value={`${dna.stats.winRate}%`} />
        <Stat label="Txns" value={compact(dna.stats.txCount)} />
        <Stat label="Contracts" value={String(dna.stats.uniqueContracts)} />
        <Stat label="Tokens" value={String(dna.stats.uniqueTokens)} />
      </div>
    </Panel>
  );
}

function RhythmCard({ dna }: { dna: WalletDNA }) {
  const maxH = Math.max(...dna.activityByHour);
  const maxD = Math.max(...dna.activityByDay);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <div style={eyebrow}>// ACTIVITY RHYTHM · UTC</div>
        <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.5)", fontFamily: MONO }}>
          dominant · {dna.dominantProtocol}
        </span>
      </div>
      <div className="mt-4">
        <div className="flex items-end gap-[3px] h-24">
          {dna.activityByHour.map((v, i) => (
            <div key={i} className="flex-1 rounded-t-[2px]" style={{
              height: `${(v / maxH) * 100}%`,
              background: `linear-gradient(180deg, ${dna.archetype.color}, ${dna.archetype.color}44)`,
              boxShadow: v > 70 ? `0 0 8px ${dna.archetype.color}80` : "none",
            }} title={`${i}:00 — ${v}`} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px]" style={{ color: "rgba(245,247,250,0.45)", fontFamily: MONO }}>
          <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1">
        {dna.activityByDay.map((v, i) => (
          <div key={i} className="rounded-[4px] py-2 text-center" style={{
            background: `${dna.archetype.color}${Math.round((v / maxD) * 40).toString(16).padStart(2, "0")}`,
            border: `1px solid ${dna.archetype.color}22`,
          }}>
            <div className="text-[9px] uppercase tracking-[0.12em]" style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO }}>{days[i]}</div>
            <div className="text-[13px] tabular-nums mt-0.5" style={{ color: "#f5f7fa", fontFamily: MONO }}>{v}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ActivityMixCard({ dna }: { dna: WalletDNA }) {
  return (
    <Panel>
      <div style={eyebrow}>// ACTIVITY MIX</div>
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
        {dna.categorySplit.map((c, i) => (
          <div key={c.key} title={`${c.label} · ${(c.share * 100).toFixed(0)}%`} style={{
            width: `${c.share * 100}%`,
            background: MIX_COLORS[i % MIX_COLORS.length],
          }} />
        ))}
      </div>
      <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {dna.categorySplit.map((c, i) => (
          <div key={c.key} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2" style={{ color: "rgba(245,247,250,0.78)" }}>
              <span className="h-2 w-2 rounded-sm" style={{ background: MIX_COLORS[i % MIX_COLORS.length] }} />
              {c.label}
            </span>
            <span className="tabular-nums" style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO }}>{(c.share * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ConvictionCard({ dna }: { dna: WalletDNA }) {
  const c = dna.conviction;
  return (
    <Panel>
      <div style={eyebrow}>// CONVICTION</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Score label="Avg hold" value={`${c.avgHoldDays}d`} color={CYAN} />
        <Score label="Sells / Buys" value={c.sellsToBuys.toFixed(2)} color={c.sellsToBuys < 0.5 ? "#34d399" : c.sellsToBuys > 1 ? "#fb7185" : "#fbbf24"} />
        <Score label="Regime steady" value={`${c.regimeConsistency}%`} color="#a78bfa" />
      </div>
      <p className="mt-4 text-xs leading-relaxed" style={{ color: "rgba(245,247,250,0.65)" }}>
        {c.avgHoldDays > 120
          ? "Long-duration holder — decisions play out over quarters, not days."
          : c.avgHoldDays < 10
            ? "Short-duration operator — turnover dominates, exposure changes hourly."
            : "Medium-duration allocator — positions rotated with narrative cycles."}
      </p>
    </Panel>
  );
}

function NarrativeCard({ dna }: { dna: WalletDNA }) {
  return (
    <Panel>
      <div style={eyebrow}>// NARRATIVE EXPOSURE</div>
      <div className="mt-3 space-y-2.5">
        {dna.narrativeExposure.map((n) => (
          <div key={n.narrative}>
            <div className="flex justify-between text-xs">
              <span style={{ color: "#f5f7fa" }}>{n.narrative}</span>
              <span className="tabular-nums" style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO }}>{Math.round(n.share * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round(n.share * 100)}%`, background: n.color, boxShadow: `0 0 6px ${n.color}80` }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RiskCard({ dna }: { dna: WalletDNA }) {
  return (
    <Panel>
      <div style={eyebrow}>// RISK VECTORS</div>
      <ul className="mt-3 space-y-2">
        {dna.riskFlags.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: r.severity === "high" ? "#fb7185" : r.severity === "med" ? "#fbbf24" : "#34d399" }} />
            <span style={{ color: "rgba(245,247,250,0.78)" }}>{r.label}</span>
            <span className="ml-auto uppercase tracking-[0.14em] text-[10px]" style={{ color: "rgba(245,247,250,0.5)", fontFamily: MONO }}>{r.severity}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function CohortCard({ dna }: { dna: WalletDNA }) {
  return (
    <Panel>
      <div style={eyebrow}>// SIMILAR WALLETS</div>
      <div className="mt-3 space-y-1.5">
        {dna.cohort.map((c) => (
          <div key={c.address} className="flex items-center justify-between text-xs">
            <Link
              to="/app/wallet"
              search={{ address: c.address }}
              className="hover:text-[#22d3ee] transition-colors"
              style={{ fontFamily: MONO, color: "#f5f7fa" }}
            >
              {c.short}
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-1 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: `${c.similarity}%`, background: CYAN }} />
              </div>
              <span className="tabular-nums" style={{ color: "rgba(245,247,250,0.55)", fontFamily: MONO }}>{c.similarity}%</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AIStrategistCard({ dna }: { dna: WalletDNA }) {
  const fn = useServerFn(analyzeWallet);
  const holdings = useMemo(() => synthesizeHoldings(dna), [dna]);
  const q = useQuery({
    queryKey: ["wallet-ai", dna.address],
    queryFn: () => fn({ data: { holdings } }),
    staleTime: 5 * 60_000,
  });
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <div style={eyebrow}>// AEGIS STRATEGIST READ</div>
        <Sparkles className="h-3.5 w-3.5" style={{ color: CYAN }} />
      </div>
      {q.isLoading && <div className="mt-3 text-xs" style={{ color: "rgba(245,247,250,0.55)" }}>Reasoning over holdings…</div>}
      {q.data?.ok === false && <div className="mt-3 text-xs" style={{ color: "#fb7185" }}>Strategist unavailable.</div>}
      {q.data?.ok && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.5)", fontFamily: MONO }}>Health</span>
            <span className="text-sm" style={{ color: CYAN, fontFamily: MONO }}>{q.data.data.health}</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(245,247,250,0.8)" }}>{q.data.data.summary}</p>
          {q.data.data.recommendations.length > 0 && (
            <ul className="text-xs space-y-1" style={{ color: "rgba(245,247,250,0.7)" }}>
              {q.data.data.recommendations.slice(0, 3).map((r, i) => <li key={i}>— {r}</li>)}
            </ul>
          )}
        </div>
      )}
      <div className="mt-4 flex gap-2 flex-wrap">
        <Link
          to="/app/chat"
          search={{ q: `Explain wallet ${dna.address}. Archetype: ${dna.archetype.label}. Balance ${usd(dna.stats.balanceUsd)}, 30d PnL ${usd(dna.stats.pnl30d)}. Narrative exposure: ${dna.narrativeExposure.map(n => `${n.narrative} ${(n.share*100).toFixed(0)}%`).join(', ')}. What's the strategy read?` } as never}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs shine-sweep"
          style={{ background: "rgba(34,211,238,0.12)", border: `1px solid ${CYAN}66`, color: CYAN }}
        >
          <MessageSquare className="h-3.5 w-3.5" /> Explain with Aegis
        </Link>
        <Link
          to="/app/timeline"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs hover-lift"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,250,0.85)" }}
        >
          <Newspaper className="h-3.5 w-3.5" /> See related events
        </Link>
      </div>
    </Panel>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────────
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] p-5 md:p-6 hover-lift" style={{ background: PANEL_BG, border: BORDER }}>
      {children}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "#34d399" : tone === "down" ? "#fb7185" : "#f5f7fa";
  return (
    <div className="rounded-[8px] p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: "rgba(245,247,250,0.5)", fontFamily: MONO }}>{label}</div>
      <div className="mt-1 tabular-nums" style={{ color, fontSize: "1.05rem", fontFamily: MONO, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Score({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-[8px] p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: "rgba(245,247,250,0.5)", fontFamily: MONO }}>{label}</div>
      <div className="mt-1 tabular-nums" style={{ color, fontSize: "1.35rem", fontWeight: 700, fontFamily: MONO }}>{value}</div>
    </div>
  );
}

function usd(n: number): string {
  const s = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${s}$${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${s}$${(a / 1_000).toFixed(1)}K`;
  return `${s}$${a.toFixed(0)}`;
}
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const MIX_COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#fb7185", "#60a5fa", "#f472b6", "#94a3b8", "#e5e7eb"];

const eyebrow: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: "0.62rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(245,247,250,0.55)",
};
