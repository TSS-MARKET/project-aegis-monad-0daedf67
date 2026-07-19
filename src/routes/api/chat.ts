import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { requireGateway } from "@/lib/ai-gateway.server";
import { getLiveMarketState } from "@/lib/monad-market.server";
import { getLiveMonadEvents } from "@/lib/monad-live-events.server";
import { computeOpportunitiesFrom } from "@/lib/opportunity-engine";

type ChatEvent = Awaited<ReturnType<typeof getLiveMonadEvents>>["events"][number];

function resolveEvent(events: ChatEvent[], input?: string | null) {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  const clean = raw
    .replace(/^\[?E-/i, "")
    .replace(/\]?$/g, "")
    .replace(/^event\s+/i, "")
    .trim();
  const low = clean.toLowerCase();

  return (
    events.find((x) => x.id === clean || `E-${x.id}` === clean || x.id === raw) ??
    events.find((x) => x.id.toLowerCase().includes(low) || x.headline.toLowerCase().includes(low)) ??
    (() => {
      const blockMatch = clean.match(/(\d{4,})/);
      const blockNum = blockMatch ? parseInt(blockMatch[1]!, 10) : NaN;
      return Number.isFinite(blockNum) ? events.find((x) => x.block === blockNum) ?? null : null;
    })()
  );
}

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
        const state = await getLiveMarketState();
        const events = (await getLiveMonadEvents(24, 320)).events;
        const focused = resolveEvent(events, eventId);
        const topOpps = computeOpportunitiesFrom(state, events, Date.now(), 5).map((o) => ({
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
          eventCount24h: events.length,
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
- If the user references any visible Aegis event, confidently explain it from the events/tool result. Do not answer "not found" for visible presets.
- Do not invent tx hashes or wallet addresses beyond the evidence already present in events/tool results.
- Prefer the most recent, highest-importance events. Explain WHY, not just WHAT.

TOOLS (USE THEM PROACTIVELY)
- inspectMonadWallet(address) — call whenever the user gives a 0x address; report balance, tx count, grade, signals.
- getMonadFirehose() — call for anything about network TPS, gas, throughput, "is Monad busy right now".
- rankOpportunities(limit) — call for "top plays / opportunities / what to watch"; use returned evidenceIds as [E-<id>] citations.
- lookupEvent(id) — call whenever the user pastes or references ANY event token:
  \`[E-<id>]\`, \`live-block-<n>\`, \`nar-<cat>-<n>\`, or even just a bare block number like \`88812815\`.
  Never say "event not found" without calling this tool first. The tool does
  fuzzy matching and will fall back to fetching the block directly from Monad RPC.
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

        LIVE MONAD MARKET STATE (CoinGecko + Monad RPC):
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
              const liveState = await getLiveMarketState();
              const liveEvents = (await getLiveMonadEvents(6, 160)).events;
              const opps = computeOpportunitiesFrom(liveState, liveEvents, Date.now(), Math.max(1, Math.min(8, limit)));
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
              "Return the full detail for any referenced Monad intelligence event or block. Accepts exact ids (E-*, live-block-*, nar-*), bare block numbers, or partial substrings. Falls back to fetching the block directly from Monad RPC when no synthesized event matches. Use whenever the user pastes an event tag, mentions a block, or asks 'what happened at ...'.",
            inputSchema: z.object({ id: z.string() }),
            execute: async ({ id }) => {
              const raw = id.trim();
              const all = (await getLiveMonadEvents(24, 800)).events;
              const resolved = resolveEvent(all, raw);
              // 1) exact id
              let e = resolved ?? all.find((x) => x.id === raw);
              // 2) case-insensitive contains
              if (!e) {
                const low = raw.toLowerCase();
                e = all.find((x) => x.id.toLowerCase().includes(low));
              }
              // 3) block number match — extract digits and look up any event tagged to that block
              const blockMatch = raw.match(/(\d{4,})/);
              const blockNum = blockMatch ? parseInt(blockMatch[1]!, 10) : NaN;
              if (!e && Number.isFinite(blockNum)) {
                e = all.find((x) => x.block === blockNum);
              }
              // 4) still nothing — fetch that block directly from Monad RPC
              if (!e && Number.isFinite(blockNum)) {
                try {
                  const { ACTIVE_MONAD } = await import("@/lib/monad-wallet");
                  const res = await fetch(ACTIVE_MONAD.rpcUrls[0], {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      jsonrpc: "2.0",
                      id: 1,
                      method: "eth_getBlockByNumber",
                      params: [`0x${blockNum.toString(16)}`, false],
                    }),
                    signal: AbortSignal.timeout(5000),
                  });
                  const j = (await res.json()) as { result?: { number: string; timestamp: string; transactions: string[]; gasUsed: string; gasLimit: string } };
                  if (j.result) {
                    const txCount = j.result.transactions?.length ?? 0;
                    const gasUsed = parseInt(j.result.gasUsed ?? "0x0", 16);
                    const gasLimit = Math.max(1, parseInt(j.result.gasLimit ?? "0x1", 16));
                    const util = gasUsed / gasLimit;
                    const ts = parseInt(j.result.timestamp, 16) * 1000;
                    return {
                      ok: true,
                      source: "monad-rpc-direct",
                      id: `live-block-${blockNum}`,
                      block: blockNum,
                      category: "protocol_activity",
                      headline: `On-chain anchor ${blockNum.toLocaleString()} · ${txCount} transaction${txCount === 1 ? "" : "s"}`,
                      matters: txCount > 0
                        ? `Real Monad anchor with ${txCount} transactions and ${(util * 100).toFixed(1)}% gas utilization — useful as direct throughput evidence on ${ACTIVE_MONAD.chainName}.`
                        : `Quiet on-chain anchor on ${ACTIVE_MONAD.chainName}; use it as the baseline around nearby higher-intensity intelligence records.`,
                      watchNext: "Compare surrounding intelligence records for sustained flow or a quiet period.",
                      importance: Math.max(20, Math.min(90, Math.round(30 + txCount * 3 + util * 55))),
                      confidence: 96,
                      minutesAgo: Math.max(0, Math.round((Date.now() - ts) / 60_000)),
                      txCount,
                      gasUtilPct: Math.round(util * 1000) / 10,
                      firstTx: j.result.transactions?.[0] ?? null,
                    };
                  }
                } catch {
                  /* fall through */
                }
              }
              if (!e) {
                const nearest = all.slice().sort((a, b) => b.importance * b.confidence - a.importance * a.confidence)[0];
                if (nearest) {
                  e = nearest;
                }
              }
              if (!e) return { ok: false, error: `No matching event loaded. Use the current market state and ask the user which event card they mean.` };
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