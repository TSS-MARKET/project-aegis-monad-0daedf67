import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireGateway } from "./ai-gateway.server";
import { getMarketState } from "./monad-data";
import { getLiveHeadlineEvent, getLiveMonadEvents, getLiveMonadReplayWindow } from "./monad-live-events.server";
import { getLiveMarketState } from "./monad-market.server";
import { computeOpportunities, computeOpportunitiesFrom } from "./opportunity-engine";

const MODEL = "openai/gpt-5.5";

const BriefSchema = z.object({
  sentiment: z.enum(["Bullish", "Neutral", "Bearish"]),
  headline: z.string(),
  bullets: z.array(z.object({ title: z.string(), detail: z.string() })),
  risks: z.array(z.string()),
  watch: z.array(z.string()),
});

async function briefPrompt() {
  const state = await getLiveMarketState();
  const events = (await getLiveMonadEvents(24, 220)).events;
  const topMovers = [...state.tokens].sort((a, b) => b.change24h - a.change24h);
  const topEvents = events
    .slice()
    .sort((a, b) => b.importance * b.confidence - a.importance * a.confidence)
    .slice(0, 8)
    .map((e) => ({ id: e.id, cat: e.category, head: e.headline, asset: e.asset?.symbol, usd: e.amountUsd, imp: e.importance, conf: e.confidence, why: e.matters }));
  const compact = {
    ecosystem: state.ecosystem,
    narratives: state.narratives,
    gainers: topMovers.slice(0, 3).map((t) => ({ s: t.symbol, c: t.change24h, v: t.volume24hUsd, n: t.narrative })),
    losers: topMovers.slice(-3).map((t) => ({ s: t.symbol, c: t.change24h, v: t.volume24hUsd, n: t.narrative })),
    whales: state.whales.slice(0, 4),
    intelligenceEvents: topEvents,
  };
  return `You are Aegis, an on-chain intelligence analyst for the Monad ecosystem. Write a concise, institutional-grade market brief for the last 24h based ONLY on this state:

${JSON.stringify(compact)}

Rules:
- Cite specific numbers and tokens; no vague statements.
- Focus on whales, liquidity, narratives, opportunities and risk. Do not lead with block numbers or raw block settlement.
- 3-5 bullets max, each punchy (<= 22 words).
- 2-3 risks, 2-3 watch items.
- No financial advice.`;
}

async function fallbackBrief() {
  const state = await getLiveMarketState();
  const events = (await getLiveMonadEvents(24, 220)).events;
  const ranked = events.slice().sort((a, b) => b.importance * b.confidence - a.importance * a.confidence);
  const lead = ranked[0];
  const whale = ranked.find((e) => e.category.startsWith("whale") || e.category === "large_transfer") ?? lead;
  const liquidity = ranked.find((e) => e.category.includes("liquidity") || e.category === "stable_flow") ?? ranked[1] ?? lead;
  const rotation = ranked.find((e) => e.category === "capital_rotation" || e.category === "dex_volume_spike") ?? ranked[2] ?? lead;
  const topNarrative = [...state.narratives].sort((a, b) => b.strength - a.strength)[0];
  const sentiment = topNarrative && topNarrative.change > 2 ? "Bullish" : topNarrative && topNarrative.change < -2 ? "Bearish" : "Neutral";
  return BriefSchema.parse({
    sentiment,
    headline: lead ? `${lead.asset?.symbol ?? "MON"} leads Monad tape with ${lead.confidence}% confidence` : "Monad tape is active but mixed",
    bullets: [lead, whale, liquidity, rotation]
      .filter(Boolean)
      .map((e) => ({ title: e!.headline, detail: `${e!.matters} Confidence ${e!.confidence}%.` })),
    risks: ranked
      .filter((e) => e.category === "whale_distribution" || e.category === "liquidity_remove" || e.category === "unusual_behavior")
      .slice(0, 3)
      .map((e) => `${e.asset?.symbol ?? "MON"}: ${e.watchNext}`),
    watch: ranked.slice(0, 3).map((e) => `${e.asset?.symbol ?? "MON"}: ${e.watchNext}`),
  });
}

export const getMarketBrief = createServerFn({ method: "GET" }).handler(async () => {
  const gateway = requireGateway({ structuredOutputs: true });
  try {
    const { experimental_output } = await generateText({
      model: gateway(MODEL),
      experimental_output: Output.object({ schema: BriefSchema }),
      prompt: await briefPrompt(),
    });
    return { ok: true as const, data: experimental_output };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      try {
        return { ok: true as const, data: BriefSchema.parse(JSON.parse(error.text ?? "{}")) };
      } catch {
        /* fallthrough */
      }
    }
    console.error(error);
    return { ok: true as const, data: await fallbackBrief() };
  }
});

const OpportunitySchema = z.object({
  opportunities: z.array(
    z.object({
      token: z.string(),
      thesis: z.string(),
      confidence: z.number(),
      reasoning: z.array(z.string()),
      catalysts: z.array(z.string()),
      risks: z.array(z.string()),
      riskScore: z.number(),
    }),
  ),
});

export const getOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  const state = await getLiveMarketState();
  const events = (await getLiveMonadEvents(6, 180)).events;
  const opportunities = computeOpportunitiesFrom(state, events, Date.now(), 4).map((o) => ({
    token: o.token.symbol,
    thesis: o.thesis,
    confidence: o.confidence,
    reasoning: o.reasoning,
    catalysts: o.catalysts,
    risks: o.risks,
    riskScore: o.riskScore,
  }));
  return { ok: true as const, data: { opportunities } };
});

const WalletIntelSchema = z.object({
  health: z.enum(["Strong", "Balanced", "Concentrated", "Fragile"]),
  summary: z.string(),
  concentration: z.string(),
  narrativeExposure: z.array(z.object({ narrative: z.string(), share: z.number() })),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const analyzeWallet = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        holdings: z.array(z.object({ symbol: z.string(), valueUsd: z.number() })),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const gateway = requireGateway({ structuredOutputs: true });
    const state = await getLiveMarketState();
    const enriched = data.holdings.map((h) => {
      const t = state.tokens.find((x) => x.symbol === h.symbol);
      return { ...h, narrative: t?.narrative ?? "Unknown", change24h: t?.change24h ?? 0 };
    });
    const total = enriched.reduce((a, b) => a + b.valueUsd, 0);
    const prompt = `You are Aegis, a Monad portfolio strategist. Analyze this wallet. Never give financial advice — describe structure and risk in plain English.

Holdings (USD): ${JSON.stringify(enriched)}
Total: $${total.toFixed(0)}
Ecosystem narratives: ${JSON.stringify(state.narratives)}

Rules: narrativeExposure shares sum to ~1. Health = one word. Recommendations describe structural moves, not tickers to buy.`;

    try {
      const { experimental_output } = await generateText({
        model: gateway(MODEL),
        experimental_output: Output.object({ schema: WalletIntelSchema }),
        prompt,
      });
      return { ok: true as const, data: experimental_output };
    } catch (error) {
      console.error(error);
      return { ok: false as const, error: (error as Error).message };
    }
  });

export const getMarketSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  return getLiveMarketState();
});

// -------- Event / Replay / Headline endpoints ------------------------------
// Cheap, deterministic, cacheable. Consumed by the dashboard headline card,
// the Intelligence Timeline, the Replay the Chain scrubber, and Ask Aegis
// grounding.

export const getEventFeed = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        windowHours: z.number().min(1).max(24).optional(),
        limit: z.number().min(1).max(200).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => getLiveMonadEvents((data.windowHours ?? 6) as 1 | 6 | 24, data.limit ?? 80));

export const getReplayFeed = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ hours: z.union([z.literal(1), z.literal(6), z.literal(24)]).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => getLiveMonadReplayWindow(data.hours ?? 6));

export const getHeadline = createServerFn({ method: "GET" }).handler(async () => {
  return getLiveHeadlineEvent();
});

// -------- Opportunity Engine ----------------------------------------------
// Deterministic, evidence-backed opportunity ranking. Cheap; can be layered
// with an AI thesis on top for the top-ranked setup.

export const getOpportunityBoard = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().min(1).max(12).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => ({
    opportunities: computeOpportunitiesFrom(await getLiveMarketState(), (await getLiveMonadEvents(6, 180)).events, Date.now(), data.limit ?? 6),
    generatedAt: new Date().toISOString(),
  }));