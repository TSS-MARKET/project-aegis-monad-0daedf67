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

        const system = `You are Aegis, an on-chain intelligence analyst embedded in the Monad ecosystem.
Answer ONLY based on the live market state below — never invent tokens or numbers. Cite specific values.
Be concise, direct, institutional. Never give financial advice; describe setups, risk, and structure.

Live Monad market state (last 2 min bucket):
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