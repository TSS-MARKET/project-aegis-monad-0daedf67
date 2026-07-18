import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketSnapshot } from "@/lib/intelligence.functions";
import { GlassCard } from "@/components/aegis/glass-card";
import { formatUsd } from "@/lib/monad-data";
import { ArrowDownRight, ArrowUpRight, Repeat } from "lucide-react";

export const Route = createFileRoute("/app/whales")({ component: WhalesPage });

const captions: Record<string, string> = {
  accumulate: "Sustained buying without corresponding sells — reads as long-term positioning.",
  distribute: "Position being unwound into thinner liquidity — watch for follow-through selling.",
  rotate: "Rotation between correlated assets — likely narrative repositioning, not thesis change.",
};

function iconFor(a: string) {
  return a === "accumulate" ? ArrowUpRight : a === "distribute" ? ArrowDownRight : Repeat;
}

function WhalesPage() {
  const fn = useServerFn(getMarketSnapshot);
  const q = useQuery({ queryKey: ["snap"], queryFn: () => fn(), refetchInterval: 60_000 });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10 space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Radar</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Whale Radar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Clustered wallet moves with plain-English captions — not another wall of hashes.
        </p>
      </header>

      <div className="space-y-3">
        {q.data?.whales.map((w, i) => {
          const Icon = iconFor(w.action);
          const tone =
            w.action === "accumulate"
              ? "text-[oklch(0.72_0.17_155)]"
              : w.action === "distribute"
                ? "text-[oklch(0.65_0.22_25)]"
                : "text-[oklch(0.78_0.16_75)]";
          return (
            <GlassCard key={i} className="p-5">
              <div className="flex items-start gap-4">
                <div className={"mt-1 " + tone}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{w.wallet}</span>
                    <span className={"text-xs uppercase tracking-widest " + tone}>{w.action}</span>
                    <span className="text-xs text-muted-foreground">{w.minutesAgo}m ago</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{formatUsd(w.amountUsd)}</span>{" "}
                    <span className="text-muted-foreground">of {w.token}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{captions[w.action]}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}