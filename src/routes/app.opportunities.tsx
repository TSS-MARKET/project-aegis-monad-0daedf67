import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOpportunities } from "@/lib/intelligence.functions";
import { GlassCard } from "@/components/aegis/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, ShieldAlert, Flame } from "lucide-react";

export const Route = createFileRoute("/app/opportunities")({ component: OpportunitiesPage });

function OpportunitiesPage() {
  const fn = useServerFn(getOpportunities);
  const q = useQuery({ queryKey: ["opps"], queryFn: () => fn(), refetchInterval: 180_000 });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10 space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Signals</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Opportunity Feed</h1>
        <p className="mt-2 text-sm text-muted-foreground">AI-generated theses with grounded reasoning. Not financial advice.</p>
      </header>

      {q.isLoading || !q.data ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {q.data.data.opportunities.map((o, i) => (
            <GlassCard key={i} className="flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Setup</div>
                  <div className="mt-1 text-2xl font-semibold">{o.token}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Confidence</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-primary">{o.confidence}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{o.thesis}</p>

              <div className="mt-4 space-y-3 text-sm">
                <Section icon={Zap} label="Reasoning" items={o.reasoning} tone="primary" />
                <Section icon={Flame} label="Catalysts" items={o.catalysts} tone="accent" />
                <Section icon={ShieldAlert} label="Risks" items={o.risks} tone="warn" />
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Risk score</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, k) => (
                    <span
                      key={k}
                      className={
                        "h-1.5 w-3 rounded-sm " +
                        (k < o.riskScore ? "bg-gradient-to-r from-primary to-[oklch(0.65_0.22_25)]" : "bg-muted")
                      }
                    />
                  ))}
                  <span className="ml-2 text-muted-foreground">{o.riskScore}/10</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  items,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  items: string[];
  tone: "primary" | "accent" | "warn";
}) {
  const toneColor =
    tone === "primary" ? "text-primary" : tone === "accent" ? "text-[oklch(0.62_0.2_195)]" : "text-[oklch(0.78_0.16_75)]";
  return (
    <div>
      <div className={"flex items-center gap-1.5 text-[10px] uppercase tracking-widest " + toneColor}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <ul className="mt-1 space-y-1">
        {items.map((i, k) => (
          <li key={k} className="text-muted-foreground text-sm">— {i}</li>
        ))}
      </ul>
    </div>
  );
}