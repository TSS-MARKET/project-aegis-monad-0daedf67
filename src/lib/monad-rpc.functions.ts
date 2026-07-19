// Live Monad JSON-RPC status. Cheap, cached, deterministic-shape response
// so the dashboard header can show real chain health without slowing SSR.
import { createServerFn } from "@tanstack/react-start";
import { ACTIVE_MONAD, MONAD_MAINNET, MONAD_TESTNET } from "./monad-wallet";

async function rpc(url: string, method: string, params: unknown[] = []) {
  const started = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(2500),
  });
  const json = (await res.json()) as { result?: string; error?: { message: string } };
  return { result: json.result, latencyMs: Date.now() - started, err: json.error?.message };
}

async function probe(url: string, chainName: string) {
  try {
    const [block, gas] = await Promise.all([
      rpc(url, "eth_blockNumber"),
      rpc(url, "eth_gasPrice"),
    ]);
    if (!block.result) return null;
    return {
      chainName,
      endpoint: url,
      blockNumber: parseInt(block.result, 16),
      gasPriceGwei: gas.result ? parseInt(gas.result, 16) / 1e9 : null,
      latencyMs: Math.max(block.latencyMs, gas.latencyMs),
      ok: true as const,
    };
  } catch {
    return null;
  }
}

export const getMonadNetworkStatus = createServerFn({ method: "GET" }).handler(async () => {
  const active = ACTIVE_MONAD;
  // Try active first, fall back to the other network so the strip is never blank.
  const primary = await probe(active.rpcUrls[0], active.chainName);
  if (primary) return { chainIdDec: active.chainIdDec, ...primary, generatedAt: Date.now() };
  const fallback = active.chainIdDec === MONAD_MAINNET.chainIdDec ? MONAD_TESTNET : MONAD_MAINNET;
  const alt = await probe(fallback.rpcUrls[0], fallback.chainName + " (fallback)");
  if (alt) return { chainIdDec: fallback.chainIdDec, ...alt, generatedAt: Date.now() };
  return { ok: false as const, error: "Monad RPC unreachable", generatedAt: Date.now() };
});