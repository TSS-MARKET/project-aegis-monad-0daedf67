// Live Monad firehose — pulls the last N blocks from Monad RPC, computes
// real on-chain TPS, gas, and per-block tx counts. Cached in Worker memory
// for 2s so the landing page can poll cheaply without saturating the RPC.
import { createServerFn } from "@tanstack/react-start";
import { ACTIVE_MONAD, MONAD_MAINNET, MONAD_TESTNET } from "./monad-wallet";

export type FirehoseBlock = {
  number: number;
  timestamp: number; // unix seconds
  txCount: number;
  gasUsed: number;
  gasLimit: number;
  utilization: number; // 0..1
};

export type FirehoseSnapshot = {
  ok: boolean;
  chainName: string;
  chainIdDec: number;
  endpoint: string;
  latencyMs: number;
  head: number;
  gasPriceGwei: number | null;
  tps: number; // rolling tx/sec across the returned window
  txPerBlockAvg: number;
  windowSeconds: number;
  totalTxWindow: number;
  blocks: FirehoseBlock[]; // newest first
  generatedAt: number;
  error?: string;
};

type RpcResponse<T> = { id: number; result?: T; error?: { message: string } };

async function rpcBatch<T>(url: string, calls: { method: string; params?: unknown[] }[]) {
  const body = calls.map((c, i) => ({ jsonrpc: "2.0", id: i, method: c.method, params: c.params ?? [] }));
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3500),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = (await res.json()) as RpcResponse<T>[];
  return json.sort((a, b) => a.id - b.id).map((r) => r.result);
}

async function rpc<T>(url: string, method: string, params: unknown[] = []): Promise<T | undefined> {
  const [r] = await rpcBatch<T>(url, [{ method, params }]);
  return r;
}

type RawBlock = {
  number: string;
  timestamp: string;
  transactions: string[];
  gasUsed: string;
  gasLimit: string;
};

const BLOCK_WINDOW = 12;

async function fetchFirehose(url: string, chainName: string, chainIdDec: number): Promise<FirehoseSnapshot | null> {
  try {
    const started = Date.now();
    const [headHex, gasHex] = await rpcBatch<string>(url, [
      { method: "eth_blockNumber" },
      { method: "eth_gasPrice" },
    ]);
    if (!headHex) return null;
    const head = parseInt(headHex, 16);
    const numbers = Array.from({ length: BLOCK_WINDOW }, (_, i) => head - i);
    const raw = await rpcBatch<RawBlock>(
      url,
      numbers.map((n) => ({ method: "eth_getBlockByNumber", params: ["0x" + n.toString(16), false] })),
    );
    const blocks: FirehoseBlock[] = raw
      .filter((b): b is RawBlock => !!b)
      .map((b) => ({
        number: parseInt(b.number, 16),
        timestamp: parseInt(b.timestamp, 16),
        txCount: b.transactions?.length ?? 0,
        gasUsed: parseInt(b.gasUsed ?? "0x0", 16),
        gasLimit: parseInt(b.gasLimit ?? "0x1", 16),
        utilization: (parseInt(b.gasUsed ?? "0x0", 16) / Math.max(1, parseInt(b.gasLimit ?? "0x1", 16))),
      }));
    if (blocks.length === 0) return null;
    const totalTx = blocks.reduce((a, b) => a + b.txCount, 0);
    const span = Math.max(1, blocks[0].timestamp - blocks[blocks.length - 1].timestamp);
    const tps = totalTx / span;
    return {
      ok: true,
      chainName,
      chainIdDec,
      endpoint: url,
      latencyMs: Date.now() - started,
      head: blocks[0].number,
      gasPriceGwei: gasHex ? parseInt(gasHex, 16) / 1e9 : null,
      tps,
      txPerBlockAvg: totalTx / blocks.length,
      windowSeconds: span,
      totalTxWindow: totalTx,
      blocks,
      generatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

// Worker-local cache. Trivial single-instance cache is fine for a hackathon;
// TTL is short so the ticker feels live but we never hammer RPC.
const CACHE = new Map<string, { at: number; snap: FirehoseSnapshot }>();
const TTL_MS = 2000;

export const getMonadFirehose = createServerFn({ method: "GET" }).handler(async () => {
  const primary = ACTIVE_MONAD;
  const fallback = primary.chainIdDec === MONAD_MAINNET.chainIdDec ? MONAD_TESTNET : MONAD_MAINNET;
  const cached = CACHE.get(primary.rpcUrls[0]);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.snap;

  let snap = await fetchFirehose(primary.rpcUrls[0], primary.chainName, primary.chainIdDec);
  if (!snap) snap = await fetchFirehose(fallback.rpcUrls[0], fallback.chainName + " (fallback)", fallback.chainIdDec);
  if (!snap) {
    return {
      ok: false,
      chainName: primary.chainName,
      chainIdDec: primary.chainIdDec,
      endpoint: primary.rpcUrls[0],
      latencyMs: 0,
      head: 0,
      gasPriceGwei: null,
      tps: 0,
      txPerBlockAvg: 0,
      windowSeconds: 0,
      totalTxWindow: 0,
      blocks: [],
      generatedAt: Date.now(),
      error: "Monad RPC unreachable",
    } satisfies FirehoseSnapshot;
  }
  CACHE.set(primary.rpcUrls[0], { at: Date.now(), snap });
  return snap;
});