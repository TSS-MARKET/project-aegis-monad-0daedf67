// Wallet Guardian — public server fn that inspects any Monad address using
// real RPC data and returns a compact risk/health scorecard. Cached briefly
// so a landing-page probe stays cheap.
import { createServerFn } from "@tanstack/react-start";
import { ACTIVE_MONAD, MONAD_MAINNET, MONAD_TESTNET } from "./monad-wallet";

export type GuardianSignal = {
  key: string;
  label: string;
  status: "ok" | "watch" | "risk";
  detail: string;
};

export type GuardianReport = {
  ok: boolean;
  address: string;
  chainName: string;
  chainIdDec: number;
  balanceMon: number;
  balanceUsd: number;
  txCount: number;
  isContract: boolean;
  ageBlocks: number | null;
  head: number;
  score: number; // 0..100
  grade: "A" | "B" | "C" | "D" | "F";
  signals: GuardianSignal[];
  generatedAt: number;
  error?: string;
};

const CACHE = new Map<string, { at: number; report: GuardianReport }>();
const TTL = 8_000;

type Rpc = { id: number; result?: string; error?: { message: string } };

async function batch(url: string, calls: { method: string; params?: unknown[] }[]) {
  const body = calls.map((c, i) => ({ jsonrpc: "2.0", id: i, method: c.method, params: c.params ?? [] }));
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = (await res.json()) as Rpc[];
  return json.sort((a, b) => a.id - b.id).map((r) => r.result);
}

const ADDR = /^0x[0-9a-fA-F]{40}$/;

async function fetchMonUsd() {
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", "monad");
  url.searchParams.set("vs_currencies", "usd");
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(3500) });
  if (!res.ok) return 0;
  const json = (await res.json()) as { monad?: { usd?: number } };
  return typeof json.monad?.usd === "number" ? json.monad.usd : 0;
}

function scoreOf(input: {
  balanceMon: number;
  txCount: number;
  isContract: boolean;
}) {
  let s = 40;
  const signals: GuardianSignal[] = [];

  if (input.isContract) {
    signals.push({ key: "type", label: "Address type", status: "watch", detail: "Smart contract — verify source before interacting" });
    s += 5;
  } else {
    signals.push({ key: "type", label: "Address type", status: "ok", detail: "Externally owned account" });
    s += 15;
  }

  if (input.txCount === 0) {
    signals.push({ key: "activity", label: "On-chain activity", status: "risk", detail: "Zero transactions — brand new or dormant" });
  } else if (input.txCount < 5) {
    signals.push({ key: "activity", label: "On-chain activity", status: "watch", detail: `${input.txCount} tx — thin history` });
    s += 8;
  } else if (input.txCount < 50) {
    signals.push({ key: "activity", label: "On-chain activity", status: "ok", detail: `${input.txCount} tx — established` });
    s += 20;
  } else {
    signals.push({ key: "activity", label: "On-chain activity", status: "ok", detail: `${input.txCount.toLocaleString()} tx — power user` });
    s += 28;
  }

  if (input.balanceMon >= 1) {
    signals.push({ key: "balance", label: "Gas runway", status: "ok", detail: `${input.balanceMon.toFixed(2)} MON — plenty of gas` });
    s += 20;
  } else if (input.balanceMon >= 0.05) {
    signals.push({ key: "balance", label: "Gas runway", status: "watch", detail: `${input.balanceMon.toFixed(3)} MON — top up soon` });
    s += 8;
  } else {
    signals.push({ key: "balance", label: "Gas runway", status: "risk", detail: "Below 0.05 MON — cannot cover a swap" });
  }

  s = Math.max(0, Math.min(100, s));
  const grade: GuardianReport["grade"] =
    s >= 80 ? "A" : s >= 65 ? "B" : s >= 45 ? "C" : s >= 25 ? "D" : "F";
  return { score: s, grade, signals };
}

async function probe(url: string, chainName: string, chainIdDec: number, address: string): Promise<GuardianReport | null> {
  try {
    const [[balanceHex, txHex, codeHex, headHex], monUsd] = await Promise.all([
      batch(url, [
        { method: "eth_getBalance", params: [address, "latest"] },
        { method: "eth_getTransactionCount", params: [address, "latest"] },
        { method: "eth_getCode", params: [address, "latest"] },
        { method: "eth_blockNumber" },
      ]),
      fetchMonUsd().catch(() => 0),
    ]);
    if (!balanceHex || !headHex) return null;
    const balanceWei = BigInt(balanceHex);
    const balanceMon = Number(balanceWei) / 1e18;
    const txCount = parseInt(txHex ?? "0x0", 16);
    const isContract = !!codeHex && codeHex !== "0x" && codeHex.length > 2;
    const head = parseInt(headHex, 16);
    const { score, grade, signals } = scoreOf({ balanceMon, txCount, isContract });
    return {
      ok: true,
      address,
      chainName,
      chainIdDec,
      balanceMon,
      balanceUsd: balanceMon * monUsd,
      txCount,
      isContract,
      ageBlocks: null,
      head,
      score,
      grade,
      signals,
      generatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export const inspectWallet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const v = input as { address?: string } | undefined;
    const address = (v?.address ?? "").trim();
    if (!ADDR.test(address)) throw new Error("Invalid Monad address");
    return { address: address.toLowerCase() };
  })
  .handler(async ({ data }) => {
    const key = `${ACTIVE_MONAD.chainIdDec}:${data.address}`;
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.report;

    const primary = ACTIVE_MONAD;
    const fallback = primary.chainIdDec === MONAD_MAINNET.chainIdDec ? MONAD_TESTNET : MONAD_MAINNET;
    let report = await probe(primary.rpcUrls[0], primary.chainName, primary.chainIdDec, data.address);
    if (!report) report = await probe(fallback.rpcUrls[0], fallback.chainName + " (fallback)", fallback.chainIdDec, data.address);
    if (!report) {
      return {
        ok: false,
        address: data.address,
        chainName: primary.chainName,
        chainIdDec: primary.chainIdDec,
        balanceMon: 0,
        balanceUsd: 0,
        txCount: 0,
        isContract: false,
        ageBlocks: null,
        head: 0,
        score: 0,
        grade: "F",
        signals: [{ key: "rpc", label: "RPC", status: "risk", detail: "Monad RPC unreachable" }],
        generatedAt: Date.now(),
        error: "Monad RPC unreachable",
      } satisfies GuardianReport;
    }
    CACHE.set(key, { at: Date.now(), report });
    return report;
  });