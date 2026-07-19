import type { MarketState, MonadToken, WhaleEvent } from "./monad-data";

type PriceRow = {
  usd?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
  usd_24h_change?: number;
};

const COINGECKO_IDS = [
  "monad",
  "wrapped-monad",
  "shmonad",
  "kintsu-staked-monad",
  "apriori-monad-lst",
  "bitcoin",
  "ethereum",
  "solana",
  "bnb",
  "xrp",
  "dogecoin",
  "toncoin",
  "avalanche-2",
  "chainlink",
  "arbitrum",
  "optimism",
  "sui",
  "aptos",
  "pepe",
  "dogwifhat",
  "tether",
  "usd-coin",
] as const;

const META: Record<string, Omit<MonadToken, "priceUsd" | "change24h" | "volume24hUsd" | "liquidityUsd" | "marketCapUsd" | "momentum">> = {
  monad: { symbol: "MON", name: "Monad", address: "coingecko:monad", narrative: "Infra", chain: "Monad", monadRelated: true, holders: 0, whaleConcentration: 0 },
  "wrapped-monad": { symbol: "wMON", name: "Wrapped Monad", address: "coingecko:wrapped-monad", narrative: "Infra", chain: "Monad", monadRelated: true, holders: 0, whaleConcentration: 0 },
  shmonad: { symbol: "SHMON", name: "ShMonad", address: "coingecko:shmonad", narrative: "DeFi", chain: "Monad", monadRelated: true, holders: 0, whaleConcentration: 0 },
  "kintsu-staked-monad": { symbol: "sMON", name: "Kintsu Staked Monad", address: "coingecko:kintsu-staked-monad", narrative: "LST", chain: "Monad", monadRelated: true, holders: 0, whaleConcentration: 0 },
  "apriori-monad-lst": { symbol: "aprMON", name: "aPriori Monad LST", address: "coingecko:apriori-monad-lst", narrative: "LST", chain: "Monad", monadRelated: true, holders: 0, whaleConcentration: 0 },
  bitcoin: { symbol: "BTC", name: "Bitcoin", address: "coingecko:bitcoin", narrative: "Major", chain: "External", holders: 0, whaleConcentration: 0 },
  ethereum: { symbol: "ETH", name: "Ethereum", address: "coingecko:ethereum", narrative: "L1", chain: "External", holders: 0, whaleConcentration: 0 },
  solana: { symbol: "SOL", name: "Solana", address: "coingecko:solana", narrative: "L1", chain: "External", holders: 0, whaleConcentration: 0 },
  bnb: { symbol: "BNB", name: "BNB", address: "coingecko:bnb", narrative: "Major", chain: "External", holders: 0, whaleConcentration: 0 },
  xrp: { symbol: "XRP", name: "XRP", address: "coingecko:xrp", narrative: "Major", chain: "External", holders: 0, whaleConcentration: 0 },
  dogecoin: { symbol: "DOGE", name: "Dogecoin", address: "coingecko:dogecoin", narrative: "Meme", chain: "External", holders: 0, whaleConcentration: 0 },
  toncoin: { symbol: "TON", name: "Toncoin", address: "coingecko:toncoin", narrative: "L1", chain: "External", holders: 0, whaleConcentration: 0 },
  "avalanche-2": { symbol: "AVAX", name: "Avalanche", address: "coingecko:avalanche-2", narrative: "L1", chain: "External", holders: 0, whaleConcentration: 0 },
  chainlink: { symbol: "LINK", name: "Chainlink", address: "coingecko:chainlink", narrative: "Infra", chain: "External", holders: 0, whaleConcentration: 0 },
  arbitrum: { symbol: "ARB", name: "Arbitrum", address: "coingecko:arbitrum", narrative: "L2", chain: "External", holders: 0, whaleConcentration: 0 },
  optimism: { symbol: "OP", name: "Optimism", address: "coingecko:optimism", narrative: "L2", chain: "External", holders: 0, whaleConcentration: 0 },
  sui: { symbol: "SUI", name: "Sui", address: "coingecko:sui", narrative: "L1", chain: "External", holders: 0, whaleConcentration: 0 },
  aptos: { symbol: "APT", name: "Aptos", address: "coingecko:aptos", narrative: "L1", chain: "External", holders: 0, whaleConcentration: 0 },
  pepe: { symbol: "PEPE", name: "Pepe", address: "coingecko:pepe", narrative: "Meme", chain: "External", holders: 0, whaleConcentration: 0 },
  dogwifhat: { symbol: "WIF", name: "dogwifhat", address: "coingecko:dogwifhat", narrative: "Meme", chain: "External", holders: 0, whaleConcentration: 0 },
  tether: { symbol: "USDT", name: "Tether", address: "coingecko:tether", narrative: "Stable", chain: "External", holders: 0, whaleConcentration: 0 },
  "usd-coin": { symbol: "USDC", name: "USD Coin", address: "coingecko:usd-coin", narrative: "Stable", chain: "External", holders: 0, whaleConcentration: 0 },
};

function emptyMarket(error?: string): MarketState {
  return {
    generatedAt: new Date().toISOString(),
    bucketMinute: Math.floor(Date.now() / 60_000),
    dataType: "live",
    source: error ? `live APIs unavailable: ${error}` : "CoinGecko + Monad RPC",
    ecosystem: { totalTvlUsd: 0, dexVolume24hUsd: 0, activeWallets24h: 0, txCount24h: 0, stablecoinInflow24hUsd: 0 },
    tokens: [],
    whales: [],
    narratives: [],
  };
}

function momentum(change: number, vol: number, cap: number) {
  const volRatio = cap > 0 ? Math.min(0.4, vol / cap) : 0;
  return Number(Math.max(-1, Math.min(1, Math.tanh(change / 8) + volRatio)).toFixed(2));
}

function tokenFromRow(id: string, row?: PriceRow): MonadToken | null {
  const meta = META[id];
  if (!meta || typeof row?.usd !== "number") return null;
  const volume = Math.round(row.usd_24h_vol ?? 0);
  const cap = Math.round(row.usd_market_cap ?? 0);
  const change = Number((row.usd_24h_change ?? 0).toFixed(2));
  return {
    ...meta,
    priceUsd: row.usd,
    change24h: change,
    volume24hUsd: volume,
    liquidityUsd: volume,
    marketCapUsd: cap,
    momentum: momentum(change, volume, cap),
  };
}

function narratives(tokens: MonadToken[]): MarketState["narratives"] {
  const groups = new Map<string, MonadToken[]>();
  tokens.forEach((t) => groups.set(t.narrative, [...(groups.get(t.narrative) ?? []), t]));
  return Array.from(groups.entries()).map(([name, list]) => {
    const cap = list.reduce((s, t) => s + t.marketCapUsd, 0);
    const change = list.reduce((s, t) => s + t.change24h * Math.max(1, t.marketCapUsd), 0) / Math.max(1, cap);
    const volume = list.reduce((s, t) => s + t.volume24hUsd, 0);
    return { name, change: Number(change.toFixed(1)), strength: Number(Math.min(1, volume / Math.max(1, cap) * 8 + 0.25).toFixed(2)) };
  });
}

async function fetchPrices(): Promise<Record<string, PriceRow>> {
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", COINGECKO_IDS.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("include_24hr_vol", "true");
  url.searchParams.set("include_market_cap", "true");
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return (await res.json()) as Record<string, PriceRow>;
}

async function fetchMonadStats() {
  const { getLiveMonadReplayWindow } = await import("./monad-live-events.server");
  const replay = await getLiveMonadReplayWindow(1, 90);
  const sampledTx = replay.events.reduce((s, e) => s + Math.max(0, Number(e.evidence.find((x) => x.id === "tx-count")?.value.replace(/,/g, "") ?? 0)), 0);
  const oldest = replay.events[0]?.ts ?? Date.now();
  const newest = replay.events[replay.events.length - 1]?.ts ?? Date.now();
  const windowSec = Math.max(1, (newest - oldest) / 1000);
  const tps = sampledTx / windowSec;
  return { replay, sampledTx, tps };
}

export async function getLiveMarketState(): Promise<MarketState> {
  try {
    const [pricesResult, statsResult] = await Promise.allSettled([fetchPrices(), fetchMonadStats()]);
    if (pricesResult.status !== "fulfilled") throw pricesResult.reason;
    const prices = pricesResult.value;
    const stats = statsResult.status === "fulfilled" ? statsResult.value : { sampledTx: 0, tps: 0 };
    const tokens = COINGECKO_IDS.map((id) => tokenFromRow(id, prices[id])).filter((t): t is MonadToken => !!t);
    if (!tokens.length) throw new Error("CoinGecko returned no tracked assets");
    const monad = tokens.filter((t) => t.chain === "Monad");
    const monadVolume = monad.reduce((s, t) => s + t.volume24hUsd, 0);
    const monadCap = monad.reduce((s, t) => s + t.marketCapUsd, 0);
    const tx24h = Math.round(stats.tps * 86_400);

    return {
      generatedAt: new Date().toISOString(),
      bucketMinute: Math.floor(Date.now() / 60_000),
      dataType: "live",
      source: statsResult.status === "fulfilled"
        ? "CoinGecko simple price + Monad public RPC"
        : `CoinGecko simple price; Monad RPC unavailable: ${(statsResult.reason as Error)?.message ?? "unknown"}`,
      ecosystem: {
        totalTvlUsd: monadCap,
        dexVolume24hUsd: monadVolume,
        activeWallets24h: stats.sampledTx,
        txCount24h: tx24h,
        stablecoinInflow24hUsd: 0,
      },
      tokens,
      whales: [] as WhaleEvent[],
      narratives: narratives(tokens),
    };
  } catch (e) {
    return emptyMarket((e as Error).message);
  }
}