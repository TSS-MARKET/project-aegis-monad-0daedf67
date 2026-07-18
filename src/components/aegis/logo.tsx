import { cn } from "@/lib/utils";

export function AegisLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className="relative block h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: "#22d3ee", boxShadow: "0 0 0 3px rgba(34,211,238,0.18)" }}
        aria-hidden
      />
      <span
        className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.18em] text-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Aegis <span className="text-[rgba(34,211,238,0.5)]">//</span>{" "}
        <span className="text-[rgba(245,247,250,0.6)]">MONAD INTELLIGENCE</span>
      </span>
    </div>
  );
}