import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/60 bg-[var(--gradient-card)] backdrop-blur-xl p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
        className,
      )}
      {...props}
    />
  );
}