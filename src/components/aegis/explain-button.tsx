import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

type Props = {
  /** The natural-language question to seed the chat with. */
  prompt: string;
  /** Optional event id — Aegis will inject the full event as focus. */
  eventId?: string;
  /** Optional free-form focus string (token symbol, wallet, narrative). */
  focus?: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "ghost" | "solid";
  className?: string;
};

/**
 * Reusable "Explain with Aegis" surface. Drop anywhere in the app to deep-link
 * a grounded question into the Copilot with optional event / focus context.
 */
export function ExplainButton({
  prompt,
  eventId,
  focus,
  label = "Explain with Aegis",
  size = "sm",
  variant = "ghost",
  className = "",
}: Props) {
  const pad = size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5";
  const fontSize = size === "sm" ? "0.6rem" : "0.65rem";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  const base =
    "inline-flex items-center gap-1.5 rounded-[6px] transition-all hover:-translate-y-px";
  const style =
    variant === "solid"
      ? {
          background: "rgba(34,211,238,0.14)",
          border: "1px solid rgba(34,211,238,0.38)",
          color: "#22d3ee",
          boxShadow: "0 0 0 3px rgba(34,211,238,0.05)",
        }
      : {
          background: "rgba(34,211,238,0.05)",
          border: "1px solid rgba(34,211,238,0.2)",
          color: "rgba(34,211,238,0.9)",
        };

  return (
    <Link
      to="/app/chat"
      search={{ q: prompt, eventId, focus }}
      className={`${base} ${pad} ${className}`}
      style={{
        ...style,
        fontFamily: "var(--font-mono)",
        fontSize,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      <Sparkles className={iconSize} strokeWidth={1.75} />
      {label}
    </Link>
  );
}
