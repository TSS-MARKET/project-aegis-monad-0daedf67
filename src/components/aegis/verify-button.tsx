import { Link } from "@tanstack/react-router";
import { ShieldCheck, ExternalLink } from "lucide-react";
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
  const pad = size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5";
  const fontSize = size === "sm" ? "0.6rem" : "0.65rem";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const base = "inline-flex items-center gap-1.5 rounded-[6px] transition-all hover:-translate-y-px";
  const style =
    variant === "solid"
      ? { background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }
      : { background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.22)", color: "rgba(52,211,153,0.9)" };

  // Prefer a real on-chain link. Fallbacks: tx → block → Aegis chat deep link.
  const commonProps = {
    className: `${base} ${pad} ${className}`,
    style: { ...style, fontFamily: MONO, fontSize, letterSpacing: "0.16em", textTransform: "uppercase" as const },
    "aria-label": "Verify this event on-chain",
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };
  const Inner = (
    <>
      <ShieldCheck className={iconSize} strokeWidth={2} />
      Verify on-chain
      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
    </>
  );

  if (event.txHash) {
    return (
      <a href={`${EXPLORER}/tx/${event.txHash}`} target="_blank" rel="noreferrer" {...commonProps}>
        {Inner}
      </a>
    );
  }
  if (event.block != null) {
    return (
      <a href={`${EXPLORER}/block/${event.block}`} target="_blank" rel="noreferrer" {...commonProps}>
        {Inner}
      </a>
    );
  }
  return (
    <Link
      to="/app/chat"
      search={{ q: `Verify event E-${event.id} — walk me through the evidence.`, eventId: event.id }}
      {...commonProps}
    >
      {Inner}
    </Link>
  );
}