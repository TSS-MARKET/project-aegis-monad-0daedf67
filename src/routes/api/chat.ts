import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { requireGateway } from "@/lib/ai-gateway.server";
import { getMarketState } from "@/lib/monad-data";
import { getMonadEvents } from "@/lib/monad-events";

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

        const result = streamText({
          model: gateway("openai/gpt-5.5"),
          system,
          messages: convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});