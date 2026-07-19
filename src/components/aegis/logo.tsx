import { cn } from "@/lib/utils";

export function AegisLogo({ className }: { className?: string }) {
  return (
    <div className={cn("group flex items-center select-none", className)}>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.35rem",
          fontWeight: 900,
          letterSpacing: "0.24em",
          color: "#f5f7fa",
          lineHeight: 1,
          textShadow:
            "0 0 32px rgba(34,211,238,0.45), 0 0 2px rgba(34,211,238,0.6)",
        }}
      >
        AEGIS
      </span>
    </div>
  );
}