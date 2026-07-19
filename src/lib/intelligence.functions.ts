import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireGateway } from "./ai-gateway.server";
import { getMarketState } from "./monad-data";

const MODEL = "openai/gpt-5.5";

const BriefSchema = z.object({
  sentiment: z.enum(["Bullish", "Neutral", "Bearish"]),
  headline: z.string(),
  bullets: z.array(z.object({ title: z.string(), detail: z.string() })),
  risks: z.array(z.string()),
  watch: z.array(z.string()),
});

function briefPrompt() {
  const state = getMarketState();
  const topMovers = [...state.tokens].sort((a, b) => b.change24h - a.change24h);
  const compact = {
    ecosystem: state.ecosystem,
    narratives: state.narratives,
    gainers: topMovers.slice(0, 3).map((t) => ({ s: t.symbol, c: t.change24h, v: t.volume24hUsd, n: t.narrative })),
    losers: topMovers.slice(-3).map((t) => ({ s: t.symbol, c: t.change24h, v: t.volume24hUsd, n: t.narrative })),
    whales: state.whales.slice(0, 4),
  };
  return `You are Aegis, an on-chain intelligence analyst for the Monad ecosystem. Write a concise, institutional-grade market brief for the last 24h based ONLY on this state:

${JSON.stringify(compact)}

Rules:
- Cite specific numbers and tokens; no vague statements.
- 3-5 bullets max, each punchy (<= 22 words).
- 2-3 risks, 2-3 watch items.
- No financial advice.`;
}

export const getMarketBrief = createServerFn({ method: "GET" }).handler(async () => {
  const gateway = requireGateway({ structuredOutputs: true });
  try {
    const { experimental_output } = await generateText({
      model: gateway(MODEL),
      experimental_output: Output.object({ schema: BriefSchema }),
      prompt: briefPrompt(),
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
    return { ok: false as const, error: (error as Error).message };
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
  const gateway = requireGateway({ structuredOutputs: true });
  const state = getMarketState();
  const candidates = state.tokens
    .filter((t) => t.narrative !== "Stable")
    .map((t) => ({
      s: t.symbol,
      n: t.narrative,
      c: t.change24h,
      v: t.volume24hUsd,
      l: t.liquidityUsd,
      m: t.momentum,
      w: t.whaleConcentration,
      h: t.holders,
    }));
  const prompt = `You are Aegis, generating opportunities on Monad. For 3 tokens from the candidates below, produce a thesis. Values: c=24h%, v=volume, l=liquidity, m=momentum(-1..1), w=whale concentration(0..1).

Candidates: ${JSON.stringify(candidates)}
Narratives: ${JSON.stringify(state.narratives)}

Rules: confidence 0-100 (integer). riskScore 1-10. Reasoning cites specific metrics. 2-3 catalysts, 2-3 risks. Never say "buy" — describe the setup.`;

  try {
    const { experimental_output } = await generateText({
      model: gateway(MODEL),
      experimental_output: Output.object({ schema: OpportunitySchema }),
      prompt,
    });
    return { ok: true as const, data: experimental_output };
  } catch (error) {
    console.error(error);
    return { ok: false as const, error: (error as Error).message };
  }
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
    const state = getMarketState();
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
  return getMarketState();
});