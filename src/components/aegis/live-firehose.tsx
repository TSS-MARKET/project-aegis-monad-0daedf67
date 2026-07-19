// Landing page live Monad firehose. Polls the RPC-backed server fn every 2s
// and renders the last N blocks as an animated bar strip with rolling TPS.
import { useEffect, useRef, useState } from "react";
import { Activity, Zap } from "lucide-react";
import { getMonadFirehose, type FirehoseSnapshot } from "@/lib/monad-live.functions";

function useFirehose() {
  const [snap, setSnap] = useState<FirehoseSnapshot | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const s = await getMonadFirehose();
        if (alive.current) setSnap(s);
      } catch { /* ignore */ }
      if (alive.current) timer = setTimeout(tick, 2000);
    };
    tick();
    return () => { alive.current = false; clearTimeout(timer!); };
  }, []);
  return snap;
}

export function LiveFirehose() {
  const snap = useFirehose();
  const [seenTx, setSeenTx] = useState(0);
  const lastHead = useRef(0);
  useEffect(() => {
    if (!snap || !snap.ok) return;
    if (snap.head !== lastHead.current) {
      // On first snapshot show the window; on new blocks add only their tx.
      const add = lastHead.current === 0
        ? snap.totalTxWindow
        : snap.blocks.filter((b) => b.number > lastHead.current).reduce((a, b) => a + b.txCount, 0);
      setSeenTx((n) => n + add);
      lastHead.current = snap.head;
    }
  }, [snap]);

  const ok = snap?.ok;
  const blocks = snap?.blocks ?? [];
  const maxTx = Math.max(1, ...blocks.map((b) => b.txCount));

  return (
    <div
      className="rounded-[10px] p-4 md:p-5"
      style={{
        background: "linear-gradient(180deg, rgba(10,18,28,0.72), rgba(4,10,16,0.72))",
        border: "1px solid rgba(34,211,238,0.18)",
        boxShadow: "0 20px 60px -30px rgba(34,211,238,0.35)",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-1.5 w-1.5 rounded-full gl-pulse-dot shrink-0"
            style={{ background: ok ? "#22d3ee" : "#f59e0b", boxShadow: ok ? "0 0 10px #22d3ee" : "0 0 10px #f59e0b" }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.65)" }}>
            Monad Firehose · {snap?.chainName ?? "…"}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Metric icon={<Zap className="w-3 h-3" />} label="TPS" value={snap ? snap.tps.toFixed(1) : "—"} />
          <Metric icon={<Activity className="w-3 h-3" />} label="Head" value={snap?.head ? `#${snap.head.toLocaleString()}` : "—"} />
          <Metric label="Tx seen" value={seenTx.toLocaleString()} highlight />
        </div>
      </div>
      <div className="flex items-end gap-[3px] h-[56px]">
        {blocks.slice().reverse().map((b) => {
          const h = Math.max(6, Math.round((b.txCount / maxTx) * 100));
          return (
            <div
              key={b.number}
              className="flex-1 rounded-sm relative group"
              style={{
                height: `${h}%`,
                background: `linear-gradient(180deg, rgba(34,211,238,${0.35 + b.utilization * 0.55}), rgba(34,211,238,0.08))`,
                border: "1px solid rgba(34,211,238,0.25)",
                transition: "height 400ms cubic-bezier(0.22,1,0.36,1)",
              }}
              title={`#${b.number} · ${b.txCount} tx · ${(b.utilization * 100).toFixed(0)}% gas`}
            />
          );
        })}
        {blocks.length === 0 && (
          <div className="w-full text-center" style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "rgba(245,247,250,0.4)" }}>
            {snap?.error ?? "Connecting to Monad RPC…"}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.45)" }}>
        <span>{blocks.length} blocks · {snap?.windowSeconds ?? 0}s window</span>
        <span>{snap?.gasPriceGwei != null ? `${snap.gasPriceGwei.toFixed(3)} gwei` : "…"} · {snap?.latencyMs ?? 0}ms rtt</span>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, highlight }: { icon?: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span style={{ color: "rgba(34,211,238,0.8)" }}>{icon}</span>}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "0.82rem", fontWeight: 700, color: highlight ? "#22d3ee" : "#f5f7fa", letterSpacing: "0.02em" }}>{value}</span>
    </div>
  );
}