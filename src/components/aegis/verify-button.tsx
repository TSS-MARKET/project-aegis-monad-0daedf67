import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, ExternalLink, PlayCircle, Sparkles, X } from "lucide-react";
import { ACTIVE_MONAD } from "@/lib/monad-wallet";

type VerifyEvent = {
  id: string;
  headline?: string;
  block?: number;
  txHash?: string;
  importance?: number;
  confidence?: number;
  minutesAgo?: number;
  asset?: { symbol?: string } | null;
  evidence?: Array<{ label: string; value: string; url?: string } | string>;
};

type Props = {
  event: VerifyEvent;
  size?: "sm" | "md";
  variant?: "ghost" | "solid";
  className?: string;
};

const MONO = "var(--font-mono)";
const EXPLORER = ACTIVE_MONAD.blockExplorerUrls[0];

/**
 * Compact "Verify" pill that opens a lightweight evidence drawer:
 * explorer links (block / tx), UTC timestamp, importance / confidence,
 * plus deep-linked "Verify with Aegis" and "Open in Replay".
 */
export function VerifyButton({ event, size = "sm", variant = "ghost", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const pad = size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5";
  const fontSize = size === "sm" ? "0.6rem" : "0.65rem";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const base = "inline-flex items-center gap-1.5 rounded-[6px] transition-all hover:-translate-y-px";
  const style =
    variant === "solid"
      ? { background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }
      : { background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.22)", color: "rgba(52,211,153,0.9)" };

  const chatSearch = {
    q: `Verify event E-${event.id} — walk me through the evidence and what to watch next.`,
    eventId: event.id,
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        type="button"
        className={`${base} ${pad} ${className}`}
        style={{ ...style, fontFamily: MONO, fontSize, letterSpacing: "0.16em", textTransform: "uppercase" }}
        aria-label="Verify this event"
      >
        <ShieldCheck className={iconSize} strokeWidth={2} />
        Verify on-chain
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[12px] p-5 md:p-6 relative"
            style={{
              background: "linear-gradient(180deg, rgba(10,18,28,0.98), rgba(4,10,16,0.98))",
              border: "1px solid rgba(34,211,238,0.22)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 3px rgba(34,211,238,0.06)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 h-7 w-7 inline-flex items-center justify-center rounded-[6px] hover:bg-white/5"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" style={{ color: "rgba(245,247,250,0.6)" }} />
            </button>

            <div
              style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#34d399" }}
            >
              // Verification · E-{event.id}
            </div>
            {event.headline && (
              <h3 className="mt-2 text-lg" style={{ fontFamily: "var(--font-serif)", color: "#f5f7fa", lineHeight: 1.2 }}>
                {event.headline}
              </h3>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]" style={{ fontFamily: MONO }}>
              <Row label="Importance" value={event.importance != null ? `${event.importance}/100` : "—"} />
              <Row label="Confidence" value={event.confidence != null ? `${event.confidence}%` : "—"} />
              <Row label="Age" value={event.minutesAgo != null ? `${event.minutesAgo}m ago (UTC)` : "—"} />
              <Row label="Asset" value={event.asset?.symbol ?? "—"} />
              <Row label="Block" value={event.block ? `#${event.block.toLocaleString()}` : "—"} />
              <Row label="Tx" value={event.txHash ? `${event.txHash.slice(0, 10)}…` : "—"} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {event.block != null && (
                <a
                  href={`${EXPLORER}/block/${event.block}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,250,0.9)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Block on explorer
                </a>
              )}
              {event.txHash && (
                <a
                  href={`${EXPLORER}/tx/${event.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,250,0.9)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Tx on explorer
                </a>
              )}
              <Link
                to="/app/chat"
                search={chatSearch}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs shine-sweep"
                style={{ background: "rgba(34,211,238,0.14)", border: "1px solid rgba(34,211,238,0.4)", color: "#22d3ee" }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Verify with Aegis
              </Link>
              <Link
                to="/app/replay"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,250,0.85)" }}
              >
                <PlayCircle className="h-3.5 w-3.5" /> Open in Replay
              </Link>
            </div>

            <p className="mt-4 text-[10px] leading-relaxed" style={{ color: "rgba(245,247,250,0.5)", fontFamily: MONO, letterSpacing: "0.06em" }}>
              Every intelligence record is anchored to a Monad RPC block. The buttons above jump straight to on-chain proof — no hand-waving.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] px-2 py-1.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: "rgba(245,247,250,0.5)" }}>
        {label}
      </div>
      <div className="mt-0.5 tabular-nums" style={{ color: "#f5f7fa" }}>
        {value}
      </div>
    </div>
  );
}