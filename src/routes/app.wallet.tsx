import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeWallet } from "@/lib/intelligence.functions";
import { GlassCard } from "@/components/aegis/glass-card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/app/wallet")({ component: WalletPage });

type Result = Awaited<ReturnType<typeof analyzeWallet>>;

const DEMO_HOLDINGS = [
  { symbol: "aiMON", valueUsd: 12400 },
  { symbol: "NAD", valueUsd: 6200 },
  { symbol: "MON", valueUsd: 2800 },
  { symbol: "GECKO", valueUsd: 1900 },
  { symbol: "USDm", valueUsd: 700 },
];

function WalletPage() {
  const fn = useServerFn(analyzeWallet);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function connect() {
    setConnected(true);
    setLoading(true);
    setResult(null);
    try {
      const r = await fn({ data: { holdings: DEMO_HOLDINGS } });
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10 space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Portfolio</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Wallet Intelligence</h1>
      </header>

      {!connected && (
        <GlassCard className="text-center py-14">
          <Wallet className="h-8 w-8 text-primary mx-auto" />
          <h2 className="mt-4 text-xl font-medium">Connect your Monad wallet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Aegis reads your holdings and returns a plain-English portfolio read — concentration, narrative overlap, and hidden
            risks.
          </p>
          <Button className="mt-6" onClick={connect}>
            Connect wallet (demo)
          </Button>
          <div className="mt-3 text-xs text-muted-foreground">Uses a sample portfolio for the hackathon demo.</div>
        </GlassCard>
      )}

      {connected && (
        <>
          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Holdings</div>
            <div className="mt-3 grid md:grid-cols-5 gap-3">
              {DEMO_HOLDINGS.map((h) => (
                <div key={h.symbol} className="rounded-lg border border-border/60 p-3">
                  <div className="text-sm font-medium">{h.symbol}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">${h.valueUsd.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            {loading || !result ? (
              <div className="text-sm text-muted-foreground">Analyzing wallet with Aegis…</div>
            ) : !result.ok ? (
              <div className="text-sm text-destructive">Failed: {result.error}</div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Portfolio health</div>
                    <div className="mt-1 text-2xl font-semibold text-primary">{result.data.health}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{result.data.summary}</p>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Narrative exposure</div>
                  <div className="mt-3 space-y-2">
                    {result.data.narrativeExposure.map((n) => (
                      <div key={n.narrative}>
                        <div className="flex justify-between text-sm">
                          <span>{n.narrative}</span>
                          <span className="text-muted-foreground">{Math.round(n.share * 100)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent"
                            style={{ width: `${Math.round(n.share * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Risks</div>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {result.data.risks.map((r, i) => (
                        <li key={i}>— {r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Strategist notes</div>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {result.data.recommendations.map((r, i) => (
                        <li key={i}>— {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Structural analysis only. Not financial advice.</div>
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}