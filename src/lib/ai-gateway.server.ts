import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(
  apiKey: string,
  options?: { structuredOutputs?: boolean },
) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    // OpenAI structured output requires strict json_schema. Without this the
    // SDK sends json_object and OpenAI rejects unless the prompt contains
    // the word "json".
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: { "Lovable-API-Key": apiKey },
  });
}

export function requireGateway(options?: { structuredOutputs?: boolean }) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key, options);
}