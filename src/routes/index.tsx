import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Activity, Radar, Compass, MessageSquare } from "lucide-react";
import { AegisLogo } from "@/components/aegis/logo";
import { GlassCard } from "@/components/aegis/glass-card";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <AegisLogo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#intelligence" className="hover:text-foreground transition-colors">Intelligence</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#monad" className="hover:text-foreground transition-colors">Why Monad</a>
        </nav>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90 transition-opacity"
        >
          Launch App <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            Built for the Monad ecosystem
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02]">
            <span className="text-gradient">Autonomous</span> intelligence for the fastest chain in crypto.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Monad ships thousands of transactions per second. Aegis reads every one — and writes you an institutional-grade brief on
            what's happening, what to watch, and where the risk is.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
            >
              Explore intelligence <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app/chat"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-5 py-3 text-sm font-medium text-foreground hover:bg-card"
            >
              Ask Aegis anything
            </Link>
          </div>
        </div>

        <GlassCard id="intelligence" className="mt-20 p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.17_155)] animate-pulse-glow" />
            Live market brief · Monad testnet
          </div>
          <h3 className="mt-3 text-2xl font-medium">Monad ecosystem sentiment: <span className="text-gradient">Bullish</span></h3>
          <ul className="mt-6 grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
            <li className="flex gap-3"><span className="text-primary">›</span> DEX volume climbing +18% into AI-narrative tokens</li>
            <li className="flex gap-3"><span className="text-primary">›</span> 4 whales accumulating aiMON over the last 40 minutes</li>
            <li className="flex gap-3"><span className="text-primary">›</span> Stablecoin inflows turning positive after 2h drawdown</li>
            <li className="flex gap-3"><span className="text-primary">›</span> LST liquidity rotating out of sMON into new pools</li>
          </ul>
        </GlassCard>

        <div id="how" className="mt-32 grid gap-6 md:grid-cols-4">
          {[
            { icon: Activity, title: "Market Brief", body: "AI-written summary of ecosystem sentiment, top movers, narratives — refreshed every 2 minutes." },
            { icon: Compass, title: "Opportunities", body: "Grounded theses with confidence, reasoning, catalysts and risk. Never just 'buy'." },
            { icon: Radar, title: "Whale Radar", body: "Cluster whale movements into human-readable stories, not a wall of hashes." },
            { icon: MessageSquare, title: "Ask Aegis", body: "Chat with a Monad-native analyst. Every answer grounded in on-chain evidence." },
          ].map((f) => (
            <GlassCard key={f.title} className="p-6">
              <f.icon className="h-5 w-5 text-primary" />
              <div className="mt-4 font-medium">{f.title}</div>
              <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</div>
            </GlassCard>
          ))}
        </div>

        <div id="monad" className="mt-32 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Why Monad — and why now.</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Monad's parallel execution and 10,000 TPS produce an on-chain firehose no human can read. That's exactly the surface
            AI is best at compressing into insight. Aegis is built for that firehose from the first block.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-8 border-t border-border/60 flex justify-between text-xs text-muted-foreground">
        <span>Aegis · Monad Intelligence · Hackathon build</span>
        <span>Not financial advice.</span>
      </footer>
    </div>
  );
}
