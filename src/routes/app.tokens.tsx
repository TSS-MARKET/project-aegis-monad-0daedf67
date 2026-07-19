import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketSnapshot } from "@/lib/intelligence.functions";
import { GlassCard } from "@/components/aegis/glass-card";
import { formatUsd } from "@/lib/monad-data";

export const Route = createFileRoute("/app/tokens")({
) => {
    await context.queryClient.ensureQueryData({ queryKey: ["snap"], queryFn: () => getMarketSnapshot() });
    return null;
  },
  component: TokensPage,
});

function TokensPage() {
  const fn = useServerFn(getMarketSnapshot);
  const q = useQuery({ queryKey: ["snap"], queryFn: () => fn(), refetchInterval: 60_000 });

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-10 pt-4 md:pt-6 pb-8 space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Explorer</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Monad Token Explorer</h1>
      </header>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="text-left px-4 py-3">Token</th>
              <th className="text-left px-4 py-3">Narrative</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">24h</th>
              <th className="text-right px-4 py-3">Volume</th>
              <th className="text-right px-4 py-3">Market Cap</th>
              <th className="text-right px-4 py-3">Source</th>
              <th className="text-right px-4 py-3">Momentum</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.tokens.map((t) => (
              <tr key={t.symbol} className="border-b border-border/40 hover:bg-card/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.symbol}</div>
                  <div className="text-xs text-muted-foreground">{t.name}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.narrative}</td>
                <td className="px-4 py-3 text-right">{formatUsd(t.priceUsd)}</td>
                <td
                  className={
                    "px-4 py-3 text-right font-medium " +
                    (t.change24h >= 0 ? "text-[oklch(0.72_0.17_155)]" : "text-[oklch(0.65_0.22_25)]")
                  }
                >
                  {t.change24h >= 0 ? "+" : ""}
                  {t.change24h.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatUsd(t.volume24hUsd)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatUsd(t.marketCapUsd)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{t.chain === "Monad" ? "Monad" : "CoinGecko"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className={"h-full " + (t.momentum >= 0 ? "bg-[oklch(0.72_0.17_155)]" : "bg-[oklch(0.65_0.22_25)]")}
                      style={{ width: `${Math.round(Math.abs(t.momentum) * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </GlassCard>
    </div>
  );
}