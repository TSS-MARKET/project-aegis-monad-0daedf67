// ============================================================================
// Aegis · Opportunity Engine
// ----------------------------------------------------------------------------
// Deterministic scorer that ranks Monad opportunities from real signals:
// momentum, turnover, whale flow, narrative rotation, and event pressure.
// Every candidate is anchored to concrete evidence events from the timeline
// so the UI (and Ask Aegis) can prove the setup, not just describe it.
// ============================================================================

import { getMarketState, type MarketState, type MonadToken } from "./monad-data";
import { getMonadEvents, type MonadEvent } from "./monad-events";

export type OpportunitySetup =
  | "accumulation"
  | "breakout"
  | "rotation-in"
  | "distribution"
  | "fade"
  | "base-building";

export type OpportunityHorizon = "intraday" | "swing" | "position";

export type ScoreComponent = {
  label: string;
  value: number; // 0..1 normalized weight contribution
  raw: string; // human-readable evidence value
  weight: number; // max points
};

export type Opportunity = {
  rank: number;
  token: MonadToken;
  setup: OpportunitySetup;
  horizon: OpportunityHorizon;
  score: number; // 0..100
  confidence: number; // 0..100 — how well the signals agree
  riskScore: number; // 1..10
  thesis: string;
  components: ScoreComponent[];
  reasoning: string[];
  catalysts: string[];
  risks: string[];
  evidence: MonadEvent[]; // top 3 grounding events
  invalidatesIf: string;
  dataType: "live" | "fallback";
};

// ---------------------------------------------------------------------------

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function usd(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function pct(n: number, digits = 1) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

// ---------------------------------------------------------------------------
// Per-token signal aggregation from the last 6h of events.
// ---------------------------------------------------------------------------

type EventSignals = {
  buyPressureUsd: number;
  sellPressureUsd: number;
  liquidityAddUsd: number;
  liquidityRemoveUsd: number;
  unusualCount: number;
  coordinatedCount: number;
  newWalletCount: number;
  evidence: MonadEvent[];
};

function aggregateEvents(symbol: string, events: MonadEvent[]): EventSignals {
  const mine = events.filter((e) => e.asset?.symbol === symbol);
  const sig: EventSignals = {
    buyPressureUsd: 0,
    sellPressureUsd: 0,
    liquidityAddUsd: 0,
    liquidityRemoveUsd: 0,
    unusualCount: 0,
    coordinatedCount: 0,
    newWalletCount: 0,
    evidence: [],
  };
  for (const e of mine) {
    const amt = e.amountUsd ?? 0;
    switch (e.category) {
      case "whale_accumulation":
        sig.buyPressureUsd += amt;
        break;
      case "whale_distribution":
        sig.sellPressureUsd += amt;
        break;
      case "liquidity_add":
        sig.liquidityAddUsd += amt;
        break;
      case "liquidity_remove":
        sig.liquidityRemoveUsd += amt;
        break;
      case "coordinated_wallets":
        sig.coordinatedCount += 1;
        break;
      case "new_wallet_wave":
        sig.newWalletCount += 1;
        break;
      case "unusual_behavior":
        sig.unusualCount += 1;
        break;
    }
  }
  sig.evidence = mine
    .slice()
    .sort((a, b) => b.importance * b.confidence - a.importance * a.confidence)
    .slice(0, 3);
  return sig;
}

// ---------------------------------------------------------------------------
// Setup classification
// ---------------------------------------------------------------------------

function classifySetup(t: MonadToken, s: EventSignals): OpportunitySetup {
  const netFlow = s.buyPressureUsd - s.sellPressureUsd;
  const netLiq = s.liquidityAddUsd - s.liquidityRemoveUsd;
  if (netFlow > 400_000 && t.momentum > 0.2 && t.change24h > 4) return "breakout";
  if (netFlow > 200_000 && t.change24h < 3 && t.momentum > 0) return "accumulation";
  if (netFlow < -300_000 || netLiq < -200_000) return "distribution";
  if (t.change24h > 6 && t.momentum < 0) return "fade";
  if (Math.abs(t.change24h) < 2 && t.momentum > -0.1) return "base-building";
  return "rotation-in";
}

function horizonFor(t: MonadToken, setup: OpportunitySetup): OpportunityHorizon {
  if (setup === "breakout" || setup === "fade") return "intraday";
  if (setup === "accumulation" || setup === "rotation-in") return "swing";
  return "position";
}

// ---------------------------------------------------------------------------
// Scoring: sum of five weighted components. Deterministic per market bucket.
// ---------------------------------------------------------------------------

function scoreToken(
  t: MonadToken,
  s: EventSignals,
  narrativeStrength: number,
): { score: number; components: ScoreComponent[] } {
  const momentum01 = clamp((t.momentum + 1) / 2, 0, 1);
  const change01 = clamp((t.change24h + 20) / 40, 0, 1);
  const turnover = t.liquidityUsd > 0 ? t.volume24hUsd / t.liquidityUsd : 0;
  const turnover01 = clamp(turnover / 4, 0, 1);
  const netFlow = s.buyPressureUsd - s.sellPressureUsd;
  const flow01 = clamp((netFlow + 1_000_000) / 2_000_000, 0, 1);
  const narrative01 = clamp((narrativeStrength + 1) / 2, 0, 1);

  const components: ScoreComponent[] = [
    { label: "Momentum", value: momentum01, raw: t.momentum.toFixed(2), weight: 25 },
    { label: "24h change", value: change01, raw: pct(t.change24h), weight: 15 },
    { label: "Turnover", value: turnover01, raw: `${turnover.toFixed(2)}x`, weight: 15 },
    {
      label: "Whale flow",
      value: flow01,
      raw: `${netFlow >= 0 ? "+" : "−"}${usd(Math.abs(netFlow))}`,
      weight: 25,
    },
    { label: "Narrative", value: narrative01, raw: pct(narrativeStrength * 100, 0), weight: 20 },
  ];
  const score = components.reduce((acc, c) => acc + c.value * c.weight, 0);
  return { score: Math.round(score), components };
}

function confidenceFor(components: ScoreComponent[], evidenceCount: number): number {
  // Agreement: how many components sit above 0.5 vs total.
  const agree = components.filter((c) => c.value >= 0.55).length;
  const evidenceBoost = clamp(evidenceCount / 3, 0, 1) * 20;
  return clamp(Math.round((agree / components.length) * 80 + evidenceBoost), 25, 96);
}

function riskFor(t: MonadToken, s: EventSignals): number {
  const whale = t.whaleConcentration * 5; // 0..5
  const liqRisk = t.liquidityUsd < 5_000_000 ? 2 : t.liquidityUsd < 15_000_000 ? 1 : 0;
  const vol = Math.min(3, Math.abs(t.change24h) / 6);
  const evtStress = clamp((s.coordinatedCount * 1 + s.unusualCount * 0.5), 0, 2);
  return clamp(Math.round(whale + liqRisk + vol + evtStress) / 2, 1, 10);
}

// ---------------------------------------------------------------------------
// Narrative helpers
// ---------------------------------------------------------------------------

function catalystsFor(t: MonadToken, s: EventSignals): string[] {
  const out: string[] = [];
  if (s.buyPressureUsd > 250_000)
    out.push(`Sustained accumulation — ${usd(s.buyPressureUsd)} in whale buys (6h)`);
  if (s.liquidityAddUsd > 100_000)
    out.push(`${usd(s.liquidityAddUsd)} liquidity added across DEX pools`);
  if (s.newWalletCount > 0) out.push(`Fresh cohort — ${s.newWalletCount} new-wallet waves observed`);
  if (t.momentum > 0.3) out.push(`Momentum score ${t.momentum.toFixed(2)} — trend intact`);
  if (t.change24h > 0 && out.length === 0)
    out.push(`Price action holding ${pct(t.change24h)} with turnover ${(t.volume24hUsd / Math.max(1, t.liquidityUsd)).toFixed(2)}x`);
  return out.slice(0, 3);
}

function risksFor(t: MonadToken, s: EventSignals): string[] {
  const out: string[] = [];
  if (t.whaleConcentration > 0.5)
    out.push(`Whale concentration ${Math.round(t.whaleConcentration * 100)}% — supply overhang`);
  if (s.sellPressureUsd > 200_000)
    out.push(`${usd(s.sellPressureUsd)} distribution logged in the last 6h`);
  if (s.liquidityRemoveUsd > 150_000)
    out.push(`${usd(s.liquidityRemoveUsd)} liquidity pulled — exit friction rising`);
  if (s.coordinatedCount > 0)
    out.push(`${s.coordinatedCount} coordinated-wallet cluster(s) flagged`);
  if (t.liquidityUsd < 5_000_000)
    out.push(`Thin liquidity (${usd(t.liquidityUsd)}) — slippage risk on size`);
  if (out.length === 0) out.push("Broad crypto beta drawdown");
  return out.slice(0, 3);
}

function thesisFor(t: MonadToken, setup: OpportunitySetup, s: EventSignals): string {
  const flowLine =
    s.buyPressureUsd > s.sellPressureUsd
      ? `Net ${usd(s.buyPressureUsd - s.sellPressureUsd)} whale inflow`
      : s.sellPressureUsd > s.buyPressureUsd
      ? `Net ${usd(s.sellPressureUsd - s.buyPressureUsd)} distribution`
      : "Balanced whale flow";
  const price = `$${t.priceUsd < 1 ? t.priceUsd.toFixed(4) : t.priceUsd.toFixed(2)}`;
  switch (setup) {
    case "breakout":
      return `${t.symbol} breaking out at ${price} (${pct(t.change24h)}). ${flowLine} with turnover ${(t.volume24hUsd / Math.max(1, t.liquidityUsd)).toFixed(2)}x liquidity.`;
    case "accumulation":
      return `${t.symbol} in quiet accumulation at ${price}. ${flowLine} against a flat tape — supply being absorbed.`;
    case "distribution":
      return `${t.symbol} showing distribution character at ${price}. ${flowLine}; watch for a lower-high.`;
    case "fade":
      return `${t.symbol} extended (${pct(t.change24h)}) with fading momentum. Setup favours mean reversion, not chase.`;
    case "base-building":
      return `${t.symbol} coiled at ${price}. Range-bound with ${flowLine.toLowerCase()} — waiting for a catalyst.`;
    default:
      return `${t.symbol} rotating in on ${t.narrative} narrative strength. ${flowLine} at ${price}.`;
  }
}

function invalidationFor(t: MonadToken, setup: OpportunitySetup): string {
  const level = (t.priceUsd * (setup === "distribution" || setup === "fade" ? 1.04 : 0.94));
  const fmt = level < 1 ? level.toFixed(4) : level.toFixed(2);
  if (setup === "distribution" || setup === "fade")
    return `Loss of thesis on reclaim of $${fmt} with rising whale buys.`;
  return `Loss of thesis on close below $${fmt} or net distribution > $500K/hr.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function computeOpportunities(now = Date.now(), limit = 6): Opportunity[] {
  const state = getMarketState(now);
  const events = getMonadEvents({ now, windowMs: 6 * 60 * 60 * 1000, limit: 200 });
  return computeOpportunitiesFrom(state, events, now, limit);
}

export function computeOpportunitiesFrom(state: MarketState, events: MonadEvent[], now = Date.now(), limit = 6): Opportunity[] {
  const narrativeByName = new Map(state.narratives.map((n) => [n.name, n.strength]));

  const candidates = state.tokens.filter(
    (t) => t.chain === "Monad" && t.narrative !== "Stable",
  );

  const scored = candidates.map((t) => {
    const sig = aggregateEvents(t.symbol, events);
    const narrativeStrength = narrativeByName.get(t.narrative) ?? 0;
    const { score, components } = scoreToken(t, sig, narrativeStrength);
    const setup = classifySetup(t, sig);
    const horizon = horizonFor(t, setup);
    const confidence = confidenceFor(components, sig.evidence.length);
    const riskScore = riskFor(t, sig);
    return {
      token: t,
      score,
      confidence,
      riskScore,
      setup,
      horizon,
      components,
      thesis: thesisFor(t, setup, sig),
      catalysts: catalystsFor(t, sig),
      risks: risksFor(t, sig),
      reasoning: components.map((c) => `${c.label}: ${c.raw} (+${Math.round(c.value * c.weight)} of ${c.weight})`),
      evidence: sig.evidence,
      invalidatesIf: invalidationFor(t, setup),
      dataType: state.dataType === "live" ? ("live" as const) : ("fallback" as const),
    };
  });

  scored.sort((a, b) => b.score * b.confidence - a.score * a.confidence);

  // Guarantee MON in the top set (ecosystem anchor exposure).
  const monIdx = scored.findIndex((o) => o.token.symbol === "MON");
  if (monIdx > 0) {
    const [mon] = scored.splice(monIdx, 1);
    scored.unshift(mon);
  }

  return scored.slice(0, limit).map((o, i) => ({ rank: i + 1, ...o }));
}
