import { ACTIVE_MONAD, MONAD_MAINNET, MONAD_TESTNET } from "./monad-wallet";
import type { MonadEvent } from "./monad-events";

type RpcResponse<T> = { id: number; result?: T; error?: { message: string } };

type RawBlock = {
  number: string;
  timestamp: string;
  transactions: string[];
  gasUsed: string;
  gasLimit: string;
};

export type LiveReplayWindow = {
  startTs: number;
  endTs: number;
  windowMs: number;
  events: MonadEvent[];
  dataType: "live";
  generatedAt: string;
  source: string;
  blocksScanned: number;
  error?: string;
};

async function rpcBatch<T>(url: string, calls: { method: string; params?: unknown[] }[]) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(calls.map((c, id) => ({ jsonrpc: "2.0", id, method: c.method, params: c.params ?? [] }))),
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error(`Monad RPC ${res.status}`);
  const json = (await res.json()) as RpcResponse<T>[];
  return json.sort((a, b) => a.id - b.id).map((r) => r.result);
}

function uniqueNumbers(nums: number[]) {
  return Array.from(new Set(nums.filter((n) => Number.isFinite(n) && n >= 0))).sort((a, b) => a - b);
}

async function fetchBlocks(url: string, numbers: number[]) {
  const out: RawBlock[] = [];
  for (let i = 0; i < numbers.length; i += 28) {
    const batch = numbers.slice(i, i + 28);
    const blocks = await rpcBatch<RawBlock>(
      url,
      batch.map((n) => ({ method: "eth_getBlockByNumber", params: [`0x${n.toString(16)}`, false] })),
    );
    out.push(...blocks.filter((b): b is RawBlock => !!b?.number && !!b?.timestamp));
  }
  return out;
}

function blockToEvent(block: RawBlock, now: number): MonadEvent {
  const number = parseInt(block.number, 16);
  const ts = parseInt(block.timestamp, 16) * 1000;
  const txCount = block.transactions?.length ?? 0;
  const gasUsed = parseInt(block.gasUsed ?? "0x0", 16);
  const gasLimit = Math.max(1, parseInt(block.gasLimit ?? "0x1", 16));
  const utilization = gasUsed / gasLimit;
  const importance = Math.max(18, Math.min(96, Math.round(28 + txCount * 4 + utilization * 60)));
  const confidence = txCount > 0 ? 98 : 92;
  const firstTx = block.transactions?.[0];
  const plural = txCount === 1 ? "transaction" : "transactions";

  return {
    id: `live-block-${number}`,
    ts,
    minutesAgo: Math.max(0, Math.round((now - ts) / 60_000)),
    block: number,
    category: "protocol_activity",
    headline: txCount > 0 ? `Block ${number.toLocaleString()} settled ${txCount} ${plural}` : `Block ${number.toLocaleString()} produced with no transactions`,
    plain:
      txCount > 0
        ? `Monad block ${number.toLocaleString()} included ${txCount} real transaction${txCount === 1 ? "" : "s"} from the public RPC.`
        : `Monad block ${number.toLocaleString()} was produced on-chain, but the sampled block carried zero transactions.`,
    matters:
      txCount > 0
        ? `This is real chain throughput evidence. Gas utilization was ${(utilization * 100).toFixed(1)}% in this block.`
        : `Empty blocks are still useful: they prove the replay is not inventing activity when the chain sample has none.`,
    importance,
    confidence,
    unusualness: Math.max(5, Math.min(100, Math.round(txCount * 8 + utilization * 55))),
    tags: ["live-rpc", "block", txCount > 0 ? "transactions" : "empty-block"],
    asset: { symbol: "MON", narrative: "Infra" },
    protocol: ACTIVE_MONAD.chainName,
    wallets: [],
    txHash: firstTx ?? "",
    evidence: [
      { id: "block", label: "Block", value: number.toLocaleString(), kind: "block", ref: `/block/${number}` },
      { id: "tx-count", label: "Tx count", value: txCount.toLocaleString(), kind: "metric" },
      { id: "gas", label: "Gas used", value: gasUsed.toLocaleString(), kind: "metric" },
      ...(firstTx ? [{ id: "tx", label: "First tx", value: `${firstTx.slice(0, 10)}…${firstTx.slice(-6)}`, kind: "tx" as const, ref: `/tx/${firstTx}` }] : []),
    ],
    watchNext: txCount > 0 ? "Compare the next sampled blocks for sustained throughput." : "If nearby blocks also stay empty, activity was genuinely quiet in that slice.",
    uncertainty: "Replay samples blocks across the selected window; it is not a full archival indexer of every transaction yet.",
    dataType: "live",
    freshnessSec: Math.max(0, Math.round((now - ts) / 1000)),
  };
}

async function buildFromRpc(url: string, chainName: string, hours: 1 | 6 | 24, limit: number): Promise<LiveReplayWindow> {
  const now = Date.now();
  const windowMs = hours * 60 * 60 * 1000;
  const [headHex] = await rpcBatch<string>(url, [{ method: "eth_blockNumber" }]);
  if (!headHex) throw new Error("Monad RPC returned no head block");
  const head = parseInt(headHex, 16);

  const probeDistance = Math.min(240, Math.max(20, head));
  const [headBlock, oldProbe] = await rpcBatch<RawBlock>(url, [
    { method: "eth_getBlockByNumber", params: [`0x${head.toString(16)}`, false] },
    { method: "eth_getBlockByNumber", params: [`0x${Math.max(0, head - probeDistance).toString(16)}`, false] },
  ]);
  if (!headBlock) throw new Error("Monad RPC returned no block payload");

  const headTs = parseInt(headBlock.timestamp, 16) * 1000;
  const oldTs = oldProbe ? parseInt(oldProbe.timestamp, 16) * 1000 : headTs - probeDistance * 1000;
  const avgBlockMs = Math.max(250, Math.min(12_000, (headTs - oldTs) / Math.max(1, probeDistance)));
  const blocksBack = Math.ceil(windowMs / avgBlockMs);
  const startBlock = Math.max(0, head - blocksBack);
  const sampleCount = Math.min(limit, hours === 24 ? 180 : hours === 6 ? 120 : 80);

  const sampled = Array.from({ length: sampleCount }, (_, i) => {
    if (sampleCount === 1) return head;
    return Math.round(startBlock + ((head - startBlock) * i) / (sampleCount - 1));
  });
  const latest = Array.from({ length: Math.min(48, head + 1) }, (_, i) => head - i);
  const blocks = await fetchBlocks(url, uniqueNumbers([...sampled, ...latest]));
  if (!blocks.length) throw new Error(`${chainName} RPC returned no sampled blocks`);
  const events = blocks.map((b) => blockToEvent(b, now)).sort((a, b) => a.ts - b.ts || a.block - b.block);

  return {
    startTs: now - windowMs,
    endTs: now,
    windowMs,
    events,
    dataType: "live",
    generatedAt: new Date(now).toISOString(),
    source: chainName,
    blocksScanned: blocks.length,
  };
}

export async function getLiveMonadReplayWindow(hours: 1 | 6 | 24 = 6, limit = 160): Promise<LiveReplayWindow> {
  const primary = ACTIVE_MONAD;
  const fallback = primary.chainIdDec === MONAD_MAINNET.chainIdDec ? MONAD_TESTNET : MONAD_MAINNET;
  try {
    return await buildFromRpc(primary.rpcUrls[0], primary.chainName, hours, limit);
  } catch (primaryError) {
    try {
      return await buildFromRpc(fallback.rpcUrls[0], `${fallback.chainName} fallback`, hours, limit);
    } catch {
      const now = Date.now();
      return {
        startTs: now - hours * 60 * 60 * 1000,
        endTs: now,
        windowMs: hours * 60 * 60 * 1000,
        events: [],
        dataType: "live",
        generatedAt: new Date(now).toISOString(),
        source: primary.chainName,
        blocksScanned: 0,
        error: (primaryError as Error).message || "Monad RPC unavailable",
      };
    }
  }
}

export async function getLiveMonadEvents(windowHours: 1 | 6 | 24 = 6, limit = 150) {
  const replay = await getLiveMonadReplayWindow(windowHours, limit);
  return {
    ...replay,
    events: replay.events.slice().sort((a, b) => b.ts - a.ts || b.block - a.block).slice(0, limit),
  };
}

export async function getLiveHeadlineEvent() {
  const feed = await getLiveMonadEvents(1, 120);
  const event = feed.events
    .slice()
    .sort((a, b) => b.importance * b.confidence - a.importance * a.confidence)[0] ?? null;
  return { event, generatedAt: feed.generatedAt, source: feed.source, error: feed.error };
}