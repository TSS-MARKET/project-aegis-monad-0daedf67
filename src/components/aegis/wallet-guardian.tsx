// Landing-page Wallet Guardian — paste any Monad address and get a
// live scorecard powered by real RPC data. No connect required.
import { useState } from "react";
import { ShieldCheck, Search, Loader2 } from "lucide-react";
import { inspectWallet, type GuardianReport } from "@/lib/wallet-guardian.functions";

const GRADE_COLOR: Record<GuardianReport["grade"], string> = {
  A: "#22d3ee",
  B: "#22d3ee",
  C: "#f59e0b",
  D: "#f59e0b",
  F: "#f43f5e",
};

const STATUS_COLOR = {
  ok: "#22d3ee",
  watch: "#f59e0b",
  risk: "#f43f5e",
} as const;

export function WalletGuardian() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GuardianReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(addr: string) {
    setLoading(true);
    setErr(null);
    try {
      const r = await inspectWallet({ data: { address: addr } });
      setReport(r);
      if (!r.ok && r.error) setErr(r.error);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to inspect");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-[10px] p-5 md:p-6"
      style={{
        background: "linear-gradient(180deg, rgba(10,18,28,0.72), rgba(4,10,16,0.72))",
        border: "1px solid rgba(34,211,238,0.18)",
        boxShadow: "0 24px 70px -32px rgba(34,211,238,0.35)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4" style={{ color: "#22d3ee" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,247,250,0.6)" }}>
          Address Inspector · Live Monad Scorecard
        </span>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (address.trim()) run(address.trim()); }}
        className="flex flex-col sm:flex-row gap-2 mb-4"
      >
        <div className="flex-1 flex items-center gap-2 rounded-md px-3 py-2.5" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(34,211,238,0.22)" }}>
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(34,211,238,0.7)" }} />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x… any Monad address"
            spellCheck={false}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ fontFamily: "var(--font-mono)", color: "#f5f7fa", letterSpacing: "0.02em" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="px-4 py-2.5 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-2 shine-sweep disabled:opacity-50"
          style={{
            fontFamily: "var(--font-sans)",
            background: "linear-gradient(135deg, #22d3ee, #0891b2)",
            color: "#001018",
            letterSpacing: "0.02em",
          }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          Inspect
        </button>
      </form>

      {!report && !err && (
        <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "rgba(245,247,250,0.4)", letterSpacing: "0.08em" }}>
          Paste any Monad address to see balance, tx count, contract flag, and a live risk grade — no wallet connect required.
        </div>
      )}
      {err && !report && (
        <div className="text-xs px-3 py-2 rounded-md" style={{ fontFamily: "var(--font-mono)", color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
          {err}
        </div>
      )}

      {report && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-md px-3 py-3" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(34,211,238,0.15)" }}>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-mono)", color: "rgba(245,247,250,0.5)" }}>
                {report.chainName} · head #{report.head.toLocaleString()}
              </div>
              <div className="truncate" style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#f5f7fa" }}>
                {report.address}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-mono)", color: "rgba(245,247,250,0.5)" }}>
                Grade
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: GRADE_COLOR[report.grade], lineHeight: 1 }}>
                {report.grade} <span style={{ fontSize: "0.75rem", color: "rgba(245,247,250,0.55)", fontWeight: 600 }}>· {report.score}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Balance" value={`${report.balanceMon.toFixed(3)} MON`} sub={`$${report.balanceUsd.toFixed(2)}`} />
            <Stat label="Tx count" value={report.txCount.toLocaleString()} sub={report.txCount === 0 ? "dormant" : "lifetime"} />
            <Stat label="Type" value={report.isContract ? "Contract" : "EOA"} sub={report.isContract ? "verify code" : "user wallet"} />
          </div>

          <div className="space-y-1.5">
            {report.signals.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(34,211,238,0.08)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: STATUS_COLOR[s.status], boxShadow: `0 0 8px ${STATUS_COLOR[s.status]}` }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>
                    {s.label}
                  </span>
                </div>
                <span className="truncate text-right" style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#f5f7fa" }}>
                  {s.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md px-3 py-2.5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(34,211,238,0.1)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: "#f5f7fa", letterSpacing: "0.01em" }}>
        {value}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "rgba(245,247,250,0.4)", letterSpacing: "0.08em" }}>
        {sub}
      </div>
    </div>
  );
}