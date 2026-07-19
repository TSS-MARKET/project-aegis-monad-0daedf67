import { cn } from "@/lib/utils";

export function AegisLogo({ className }: { className?: string }) {
  return (
    <div className={cn("group flex items-center gap-2.5 select-none", className)}>
      <span
        className="relative inline-flex h-7 w-7 items-center justify-center rounded-[6px] shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(34,211,238,0.05))",
          border: "1px solid rgba(34,211,238,0.45)",
          boxShadow: "0 0 24px -6px rgba(34,211,238,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
        aria-hidden
      >
        <span
          className="block h-1.5 w-1.5 rounded-full animate-pulse-glow"
          style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.9)" }}
        />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            fontWeight: 900,
            letterSpacing: "0.22em",
            color: "#f5f7fa",
            lineHeight: 1,
            textShadow: "0 0 24px rgba(34,211,238,0.35)",
          }}
        >
          AEGIS
        </span>
        <span
          className="hidden sm:inline"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.58rem",
            letterSpacing: "0.2em",
            color: "rgba(34,211,238,0.75)",
            textTransform: "uppercase",
          }}
        >
          / MONAD
        </span>
      </span>
    </div>
  );
}