import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

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

/**
 * Compact "Verify" pill that opens a lightweight evidence drawer:
 * explorer links (block / tx), UTC timestamp, importance / confidence,
 * plus deep-linked "Verify with Aegis" and "Open in Replay".
 */
export function VerifyButton({ event, size = "sm", variant = "ghost", className = "" }: Props) {
  const pad = size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5";
  const fontSize = size === "sm" ? "0.6rem" : "0.65rem";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const base = "inline-flex items-center gap-1.5 rounded-[6px] transition-all hover:-translate-y-px";
  const style =
    variant === "solid"
      ? { background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }
      : { background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.22)", color: "rgba(52,211,153,0.9)" };

  // Always route to Ask Aegis — the AI cites the actual engine evidence.
  // Fabricated tx/block placeholders are intentionally NOT linked.
  return (
    <Link
      to="/app/chat"
      search={{
        q: `Verify event E-${event.id}${event.headline ? ` — "${event.headline}"` : ""}. Walk me through the evidence and what to watch next.`,
        eventId: event.id,
      }}
      onClick={(e) => e.stopPropagation()}
      className={`${base} ${pad} ${className}`}
      style={{ ...style, fontFamily: MONO, fontSize, letterSpacing: "0.16em", textTransform: "uppercase" }}
      aria-label="Verify this event with Aegis"
    >
      <Sparkles className={iconSize} strokeWidth={2} />
      Verify with Aegis
    </Link>
  );
}