// Real Monad Mainnet events derived from live JSON-RPC.
// Every event carries a genuine tx hash and block number — links resolve on
// monadexplorer.com. Cached briefly so the dashboard stays snappy.
import { createServerFn } from "@tanstack/react-start";
import { ACTIVE_MONAD } from "./monad-wallet";

export type ChainEvent = {
  id: string;
  kind: "transfer" | "contract_create" | "contract_call";
  headline: string;
  block: number;
  txHash: string;
  from: string;
  to: string | null;
  valueMon: number;
  gasGwei: number;
  timestamp: number; // seconds
  minutesAgo: number;
  isReal: true;
  explorerTxUrl: string;
  explorerBlockUrl: string;
};

type RpcTx = {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice?: string;
  input?: string;
};
type RpcBlock = {
  number: string;
  hash: string;
  timestamp: string;
  transactions: RpcTx[];
};

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(ACTIVE_MONAD.rpcUrls[0], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(4000),
  });
  const json = (await res.json()) as { result: T; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

let cache: { at: number; events: ChainEvent[] } | null = null;
const TTL_MS = 8000;

export const getLiveChainEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ events: ChainEvent[]; block: number; generatedAt: number; ok: boolean; error?: string }> => {
    if (cache && Date.now() - cache.at < TTL_MS) {
      return { events: cache.events, block: cache.events[0]?.block ?? 0, generatedAt: cache.at, ok: true };
    }
    try {
      const explorer = ACTIVE_MONAD.blockExplorerUrls[0];
      const latestHex = await rpc<string>("eth_blockNumber", []);
      const latest = parseInt(latestHex, 16);
      // Sample last 4 blocks in parallel.
      const blockNums = [0, 1, 2, 3].map((i) => latest - i);
      const blocks = await Promise.all(
        blockNums.map((n) => rpc<RpcBlock>("eth_getBlockByNumber", [`0x${n.toString(16)}`, true])),
      );
      const now = Math.floor(Date.now() / 1000);
      const events: ChainEvent[] = [];
      for (const block of blocks) {
        if (!block?.transactions) continue;
        const bn = parseInt(block.number, 16);
        const ts = parseInt(block.timestamp, 16);
        // Rank tx: prefer largest MON value, else contract creates, else calls.
        const ranked = [...block.transactions].sort(
          (a, b) => parseInt(b.value || "0x0", 16) - parseInt(a.value || "0x0", 16),
        );
        for (const tx of ranked.slice(0, 4)) {
          const valWei = BigInt(tx.value || "0x0");
          const valueMon = Number(valWei) / 1e18;
          const gasGwei = tx.gasPrice ? parseInt(tx.gasPrice, 16) / 1e9 : 0;
          const kind: ChainEvent["kind"] = !tx.to
            ? "contract_create"
            : valueMon > 0
              ? "transfer"
              : "contract_call";
          const headline =
            kind === "contract_create"
              ? `Contract deployed by ${short(tx.from)}`
              : kind === "transfer"
                ? `${valueMon.toLocaleString(undefined, { maximumFractionDigits: 3 })} MON · ${short(tx.from)} → ${short(tx.to!)}`
                : `Contract call · ${short(tx.from)} → ${short(tx.to!)}`;
          events.push({
            id: `${bn}-${tx.hash.slice(2, 10)}`,
            kind,
            headline,
            block: bn,
            txHash: tx.hash,
            from: tx.from,
            to: tx.to,
            valueMon,
            gasGwei,
            timestamp: ts,
            minutesAgo: Math.max(0, Math.round((now - ts) / 60)),
            isReal: true,
            explorerTxUrl: `${explorer}/tx/${tx.hash}`,
            explorerBlockUrl: `${explorer}/block/${bn}`,
          });
        }
      }
      cache = { at: Date.now(), events };
      return { events, block: latest, generatedAt: Date.now(), ok: true };
    } catch (e) {
      return {
        events: cache?.events ?? [],
        block: 0,
        generatedAt: Date.now(),
        ok: false,
        error: e instanceof Error ? e.message : "RPC unreachable",
      };
    }
  },
);
