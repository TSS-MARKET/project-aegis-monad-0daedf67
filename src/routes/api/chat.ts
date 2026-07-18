import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { requireGateway } from "@/lib/ai-gateway.server";
import { getMarketState } from "@/lib/monad-data";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const gateway = requireGateway();
        const state = getMarketState();
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
        };

        const system = `You are Aegis — an institutional on-chain intelligence analyst embedded in the Monad ecosystem.

VOICE
- Direct, terse, institutional. No hype, no emojis, no financial advice.
- Cite specific tokens, prices, %s, USD values from the live state — never invent numbers.
- Speak in structure: setup / risk / catalyst.

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