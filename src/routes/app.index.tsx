import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketBrief, getMarketSnapshot } from "@/lib/intelligence.functions";
import { GlassCard } from "@/components/aegis/glass-card";
import { formatUsd } from "@/lib/monad-data";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, Eye } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const briefFn = useServerFn(getMarketBrief);
  const snapFn = useServerFn(getMarketSnapshot);
  const brief = useQuery({ queryKey: ["brief"], queryFn: () => briefFn(), refetchInterval: 120_000 });
  const snap = useQuery({ queryKey: ["snap"], queryFn: () => snapFn(), refetchInterval: 60_000 });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10 space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Monad Market Brief</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {snap.data
          ? [
              { label: "TVL", value: formatUsd(snap.data.ecosystem.totalTvlUsd) },
              { label: "24h DEX Vol", value: formatUsd(snap.data.ecosystem.dexVolume24hUsd) },
              { label: "Active Wallets", value: snap.data.ecosystem.activeWallets24h.toLocaleString() },
              { label: "24h Tx", value: (snap.data.ecosystem.txCount24h / 1e6).toFixed(2) + "M" },
              {
                label: "Stable Inflow",
                value: formatUsd(snap.data.ecosystem.stablecoinInflow24hUsd),
                accent: snap.data.ecosystem.stablecoinInflow24hUsd >= 0 ? "pos" : "neg",
              },
            ].map((s) => (
              <GlassCard key={s.label} className="p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                <div
                  className={
                    "mt-1 text-lg font-semibold " +
                    (s.accent === "pos" ? "text-[oklch(0.72_0.17_155)]" : s.accent === "neg" ? "text-[oklch(0.65_0.22_25)]" : "")
                  }
                >
                  {s.value}
                </div>
              </GlassCard>
            ))
          : Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.17_155)] animate-pulse-glow" />
            AI Market Brief · refreshes every 2 min
          </div>
          {brief.data?.ok && (
            <span className="text-xs px-2 py-1 rounded-full border border-border bg-card/60">
              Sentiment · <span className="text-primary font-medium">{brief.data.data.sentiment}</span>
            </span>
          )}
        </div>

        {brief.isLoading || !brief.data ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : brief.data.ok ? (
          <div className="mt-4">
            <h2 className="text-2xl font-medium leading-snug">{brief.data.data.headline}</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {brief.data.data.bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{b.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{b.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> Risks
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {brief.data.data.risks.map((r, i) => (
                    <li key={i} className="text-muted-foreground">— {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3 w-3" /> Watch
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {brief.data.data.watch.map((r, i) => (
                    <li key={i} className="text-muted-foreground">— {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-destructive">Failed to load brief: {brief.data.error}</div>
        )}
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Narrative strength</div>
          <div className="mt-4 space-y-3">
            {snap.data?.narratives.map((n) => (
              <div key={n.name}>
                <div className="flex justify-between text-sm">
                  <span>{n.name}</span>
                  <span className={n.change >= 0 ? "text-[oklch(0.72_0.17_155)]" : "text-[oklch(0.65_0.22_25)]"}>
                    {n.change >= 0 ? "+" : ""}
                    {n.change.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${Math.round(n.strength * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Top movers · 24h</div>
          <div className="mt-4 space-y-2">
            {snap.data &&
              [...snap.data.tokens]
                .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
                .slice(0, 6)
                .map((t) => (
                  <div key={t.symbol} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{t.symbol}</span>
                      <span className="text-xs text-muted-foreground">{t.narrative}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{formatUsd(t.priceUsd)}</span>
                      <span
                        className={
                          "font-medium " +
                          (t.change24h >= 0 ? "text-[oklch(0.72_0.17_155)]" : "text-[oklch(0.65_0.22_25)]")
                        }
                      >
                        {t.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 inline mr-1" />
                        )}
                        {t.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}