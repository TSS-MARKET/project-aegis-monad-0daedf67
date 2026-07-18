import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-[10px] border p-6 backdrop-blur-xl",
        "border-[rgba(34,211,238,0.16)] bg-[linear-gradient(180deg,rgba(10,18,28,0.65),rgba(4,10,16,0.65))]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
      {...props}
    />
  );
}