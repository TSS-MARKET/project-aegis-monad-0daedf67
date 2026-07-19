import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { requireGateway } from "@/lib/ai-gateway.server";
import { getMarketState } from "@/lib/monad-data";
import { getMonadEvents } from "@/lib/monad-events";
import { computeOpportunities } from "@/lib/opportunity-engine";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: UIMessage[];
          eventId?: string;
          focus?: string;
        };
        const { messages, eventId, focus } = body;
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const gateway = requireGateway();
        const state = getMarketState();
        const events = getMonadEvents({ windowMs: 6 * 60 * 60 * 1000, limit: 40 });
        const focused = eventId ? events.find((e) => e.id === eventId) : null;
        const topOpps = computeOpportunities(Date.now(), 5).map((o) => ({
          rank: o.rank,
          sym: o.token.symbol,
          setup: o.setup,
          horizon: o.horizon,
          score: o.score,
          conf: o.confidence,
          risk: o.riskScore,
          thesis: o.thesis,
        }));
        const evidence = events.slice(0, 18).map((e) => ({
          id: e.id,
          min: e.minutesAgo,
          cat: e.category,
          head: e.headline,
          imp: e.importance,
          conf: e.confidence,
          asset: e.asset?.symbol,
          usd: e.amountUsd,
          tx: e.txHash.slice(0, 10) + "…",
          matters: e.matters,
        }));
        const context = {
          ecosystem: state.ecosystem,
          narratives: state.narratives,
          tokens: state.tokens.map((t) => ({
            s: t.symbol,
            n: t.narrative,
            p: t.priceUsd,
            c: t.change24h,
            v: t.volume24hUsd,
            l: t.liquidityUsd,
            m: t.momentum,
            w: t.whaleConcentration,
          })),
          whales: state.whales,
          events: evidence,
          opportunities: topOpps,
        };

        const system = `You are Aegis — an institutional on-chain intelligence analyst embedded in the Monad ecosystem.

VOICE
- Direct, terse, institutional. No hype, no emojis, no financial advice.
- Cite specific tokens, prices, %s, USD values from the live state — never invent numbers.
- Speak in structure: setup / risk / catalyst.

EVIDENCE-FIRST GROUNDING (STRICT)
- Every non-trivial claim must be anchored to a token in "tokens" or an event in "events".
- When you reference an event, cite it inline as [E-<id>] using the event's id.
- If the live state does not contain the answer, say so plainly. Do not invent tx hashes, wallets, or numbers.
- Prefer the most recent, highest-importance events. Explain WHY, not just WHAT.

TOOLS (USE THEM PROACTIVELY)
- inspectMonadWallet(address) — call whenever the user gives a 0x address; report balance, tx count, grade, signals.
- getMonadFirehose() — call for anything about network TPS, gas, throughput, "is Monad busy right now".
- rankOpportunities(limit) — call for "top plays / opportunities / what to watch"; use returned evidenceIds as [E-<id>] citations.
- lookupEvent(id) — call when the user pastes or references an [E-<id>] tag.
- After tool calls, weave the returned facts into a terse institutional answer and cite the evidence ids.
${focused ? `\nFOCUS EVENT (user is asking about this):\n${JSON.stringify({
  id: focused.id,
  category: focused.category,
  headline: focused.headline,
  matters: focused.matters,
  watchNext: focused.watchNext,
  uncertainty: focused.uncertainty,
  importance: focused.importance,
  confidence: focused.confidence,
  asset: focused.asset,
  amountUsd: focused.amountUsd,
  wallets: focused.wallets,
  txHash: focused.txHash,
  evidence: focused.evidence,
  minutesAgo: focused.minutesAgo,
})}\n` : ""}
${focus ? `\nUSER FOCUS: ${focus}\n` : ""}

FORMATTING RULES (STRICT — the UI renders markdown)
- NEVER use single or double asterisks (*, **) for emphasis. Use plain text.
- Use short paragraphs. Use "- " bullets for lists. Use \`inline code\` for tokens, addresses, or metrics.
- Use "###" headings for section titles when structuring a longer answer. Never use "**Heading**" style.
- Keep answers under ~180 words unless the user asks for depth.

LIVE MONAD MARKET STATE (2-minute bucket):
${JSON.stringify(context)}`;

        const tools = {
          inspectMonadWallet: tool({
            description:
              "Inspect any Monad address via live RPC. Returns balance in MON, tx count, EOA vs contract, health score, grade, and qualitative signals. Use when the user asks about a specific 0x address.",
            inputSchema: z.object({ address: z.string().describe("A Monad 0x address") }),
            execute: async ({ address }) => {
              const { inspectWallet } = await import("@/lib/wallet-guardian.functions");
              try {
                return await inspectWallet({ data: { address } });
              } catch (e) {
                return { ok: false, error: (e as Error).message };
              }
            },
          }),
          getMonadFirehose: tool({
            description:
              "Fetch the last ~12 Monad blocks with real TPS, gas utilization, head block, and per-block tx counts. Use when the user asks about network activity, TPS, gas, or throughput.",
            inputSchema: z.object({}),
            execute: async () => {
              const { getMonadFirehose } = await import("@/lib/monad-live.functions");
              try {
                const snap = await getMonadFirehose();
                return {
                  ok: snap.ok,
                  chain: snap.chainName,
                  head: snap.head,
                  tps: snap.tps,
                  avgTxPerBlock: snap.txPerBlockAvg,
                  gasPriceGwei: snap.gasPriceGwei,
                  windowSec: snap.windowSeconds,
                  totalTxWindow: snap.totalTxWindow,
                  blocks: snap.blocks.slice(0, 6),
                };
              } catch (e) {
                return { ok: false, error: (e as Error).message };
              }
            },
          }),
          rankOpportunities: tool({
            description:
              "Return the top ranked Monad opportunities with setup, horizon, score, confidence, risk, thesis, catalysts, risks, and grounding evidence event ids. Use when the user asks what to watch, top plays, opportunities, or setups.",
            inputSchema: z.object({ limit: z.number().describe("How many opportunities (1-8)") }),
            execute: async ({ limit }) => {
              const opps = computeOpportunities(Date.now(), Math.max(1, Math.min(8, limit)));
              return opps.map((o) => ({
                rank: o.rank,
                sym: o.token.symbol,
                setup: o.setup,
                horizon: o.horizon,
                score: o.score,
                confidence: o.confidence,
                risk: o.riskScore,
                thesis: o.thesis,
                catalysts: o.catalysts,
                risks: o.risks,
                evidenceIds: o.evidence.map((e) => e.id),
                invalidatesIf: o.invalidatesIf,
              }));
            },
          }),
          lookupEvent: tool({
            description:
              "Return the full detail for a single Monad intelligence event by its id (e.g. E-abc123). Use when the user references an [E-*] tag or wants deeper context on an event.",
            inputSchema: z.object({ id: z.string() }),
            execute: async ({ id }) => {
              const all = getMonadEvents({ windowMs: 24 * 60 * 60 * 1000, limit: 400 });
              const e = all.find((x) => x.id === id);
              if (!e) return { ok: false, error: "Event not found" };
              return {
                ok: true,
                id: e.id,
                category: e.category,
                headline: e.headline,
                matters: e.matters,
                watchNext: e.watchNext,
                uncertainty: e.uncertainty,
                importance: e.importance,
                confidence: e.confidence,
                asset: e.asset,
                amountUsd: e.amountUsd,
                wallets: e.wallets,
                txHash: e.txHash,
                evidence: e.evidence,
                minutesAgo: e.minutesAgo,
              };
            },
          }),
        };

        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system,
          messages: convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(50),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});