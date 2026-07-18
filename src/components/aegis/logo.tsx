import { cn } from "@/lib/utils";

export function AegisLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-accent opacity-90" />
        <div className="absolute inset-[3px] rounded-md bg-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse-glow" />
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-semibold tracking-tight text-foreground">Aegis</span>
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Monad Intelligence</span>
      </div>
    </div>
  );
}