// Local fallback market state. Production screens use src/lib/monad-market.server.ts
// for live CoinGecko + Monad RPC data; keep this file only for offline rendering.
import { getBinanceCache } from "./binance-prices";

export type MonadToken = {
  symbol: string;
  name: string;
  address: string;
  narrative: "AI" | "DeFi" | "Meme" | "Infra" | "LST" | "Stable" | "Major" | "L1" | "L2";
  chain?: "Monad" | "External";
  monadRelated?: boolean;
  priceUsd: number;
  change24h: number;
  volume24hUsd: number;
  liquidityUsd: number;
  marketCapUsd: number;
  holders: number;
  whaleConcentration: number; // 0-1
  momentum: number; // -1..1
};

export type WhaleEvent = {
  wallet: string;
  action: "accumulate" | "distribute" | "rotate";
  token: string;
  amountUsd: number;
  minutesAgo: number;
};

export type MarketState = {
  generatedAt: string;
  bucketMinute: number;
  dataType?: "live" | "fallback";
  source?: string;
  ecosystem: {
    totalTvlUsd: number;
    dexVolume24hUsd: number;
    activeWallets24h: number;
    txCount24h: number;
    stablecoinInflow24hUsd: number;
  };
  tokens: MonadToken[];
  whales: WhaleEvent[];
  narratives: { name: string; strength: number; change: number }[];
};

type SeedToken = Omit<MonadToken, "priceUsd" | "change24h" | "volume24hUsd" | "liquidityUsd" | "marketCapUsd" | "momentum"> & { basePrice: number; volFloor: number; volCeil: number; drift: number };

const MONAD_TOKENS: SeedToken[] = [
  { symbol: "MON", name: "Monad", address: "0x0000000000000000000000000000000000000000", narrative: "Infra", chain: "Monad", monadRelated: true, holders: 148230, whaleConcentration: 0.31, basePrice: 3.42, volFloor: 20_000_000, volCeil: 90_000_000, drift: 0.08 },
  { symbol: "wMON", name: "Wrapped Monad", address: "0x0000000000000000000000000000000000000001", narrative: "Infra", chain: "Monad", monadRelated: true, holders: 42110, whaleConcentration: 0.28, basePrice: 3.44, volFloor: 8_000_000, volCeil: 40_000_000, drift: 0.08 },
  { symbol: "aiMON", name: "Aether Monad", address: "0x0000000000000000000000000000000000000002", narrative: "AI", chain: "Monad", monadRelated: true, holders: 8210, whaleConcentration: 0.42, basePrice: 0.87, volFloor: 3_000_000, volCeil: 22_000_000, drift: 0.16 },
  { symbol: "NAD", name: "Nadmind", address: "0x0000000000000000000000000000000000000003", narrative: "AI", chain: "Monad", monadRelated: true, holders: 6320, whaleConcentration: 0.55, basePrice: 0.24, volFloor: 1_500_000, volCeil: 14_000_000, drift: 0.22 },
  { symbol: "MDX", name: "MonadDex", address: "0x0000000000000000000000000000000000000004", narrative: "DeFi", chain: "Monad", monadRelated: true, holders: 12480, whaleConcentration: 0.36, basePrice: 1.62, volFloor: 4_000_000, volCeil: 26_000_000, drift: 0.11 },
  { symbol: "sMON", name: "Staked Monad", address: "0x0000000000000000000000000000000000000005", narrative: "LST", chain: "Monad", monadRelated: true, holders: 21030, whaleConcentration: 0.29, basePrice: 3.51, volFloor: 3_000_000, volCeil: 18_000_000, drift: 0.07 },
  { symbol: "GECKO", name: "Monad Gecko", address: "0x0000000000000000000000000000000000000006", narrative: "Meme", chain: "Monad", monadRelated: true, holders: 3420, whaleConcentration: 0.61, basePrice: 0.0043, volFloor: 800_000, volCeil: 12_000_000, drift: 0.32 },
  { symbol: "PARA", name: "Parallax", address: "0x0000000000000000000000000000000000000007", narrative: "Infra", chain: "Monad", monadRelated: true, holders: 5210, whaleConcentration: 0.44, basePrice: 0.71, volFloor: 1_200_000, volCeil: 9_000_000, drift: 0.12 },
  { symbol: "LEND", name: "Monad Lend", address: "0x0000000000000000000000000000000000000008", narrative: "DeFi", chain: "Monad", monadRelated: true, holders: 7040, whaleConcentration: 0.33, basePrice: 0.19, volFloor: 900_000, volCeil: 7_500_000, drift: 0.14 },
  { symbol: "USDm", name: "USD Monad", address: "0x0000000000000000000000000000000000000009", narrative: "Stable", chain: "Monad", monadRelated: true, holders: 54210, whaleConcentration: 0.22, basePrice: 1.0, volFloor: 30_000_000, volCeil: 90_000_000, drift: 0.002 },
];

const MONAD_TOKENS_EXTRA: SeedToken[] = [
  { symbol: "AETH", name: "Aetherswap", address: "0x000000000000000000000000000000000000000a", narrative: "DeFi", chain: "Monad", monadRelated: true, holders: 9820, whaleConcentration: 0.37, basePrice: 0.94, volFloor: 2_200_000, volCeil: 15_000_000, drift: 0.13 },
  { symbol: "PERP", name: "Parallax Perps", address: "0x000000000000000000000000000000000000000b", narrative: "DeFi", chain: "Monad", monadRelated: true, holders: 4310, whaleConcentration: 0.48, basePrice: 0.36, volFloor: 1_400_000, volCeil: 11_000_000, drift: 0.17 },
  { symbol: "VLT", name: "Aether Vault", address: "0x000000000000000000000000000000000000000c", narrative: "DeFi", chain: "Monad", monadRelated: true, holders: 5670, whaleConcentration: 0.4, basePrice: 1.24, volFloor: 900_000, volCeil: 8_000_000, drift: 0.11 },
  { symbol: "iMON", name: "Interest Monad", address: "0x000000000000000000000000000000000000000d", narrative: "LST", chain: "Monad", monadRelated: true, holders: 11230, whaleConcentration: 0.31, basePrice: 3.48, volFloor: 1_800_000, volCeil: 12_000_000, drift: 0.06 },
  { symbol: "rMON", name: "Restaked Monad", address: "0x000000000000000000000000000000000000000e", narrative: "LST", chain: "Monad", monadRelated: true, holders: 7830, whaleConcentration: 0.34, basePrice: 3.56, volFloor: 1_500_000, volCeil: 9_500_000, drift: 0.07 },
  { symbol: "NADAI", name: "Nad Agent", address: "0x000000000000000000000000000000000000000f", narrative: "AI", chain: "Monad", monadRelated: true, holders: 3910, whaleConcentration: 0.58, basePrice: 0.11, volFloor: 700_000, volCeil: 6_800_000, drift: 0.28 },
  { symbol: "SYNA", name: "Synapse", address: "0x0000000000000000000000000000000000000010", narrative: "AI", chain: "Monad", monadRelated: true, holders: 2810, whaleConcentration: 0.61, basePrice: 0.42, volFloor: 900_000, volCeil: 7_200_000, drift: 0.24 },
  { symbol: "PEPM", name: "Pepe Monad", address: "0x0000000000000000000000000000000000000011", narrative: "Meme", chain: "Monad", monadRelated: true, holders: 5120, whaleConcentration: 0.66, basePrice: 0.0000891, volFloor: 500_000, volCeil: 8_800_000, drift: 0.35 },
  { symbol: "MOAN", name: "Moan", address: "0x0000000000000000000000000000000000000012", narrative: "Meme", chain: "Monad", monadRelated: true, holders: 2140, whaleConcentration: 0.7, basePrice: 0.00214, volFloor: 300_000, volCeil: 5_500_000, drift: 0.38 },
  { symbol: "BRDG", name: "Monad Bridge", address: "0x0000000000000000000000000000000000000013", narrative: "Infra", chain: "Monad", monadRelated: true, holders: 8940, whaleConcentration: 0.35, basePrice: 0.58, volFloor: 1_100_000, volCeil: 7_400_000, drift: 0.1 },
  { symbol: "ORAC", name: "Monad Oracle", address: "0x0000000000000000000000000000000000000014", narrative: "Infra", chain: "Monad", monadRelated: true, holders: 4620, whaleConcentration: 0.42, basePrice: 2.14, volFloor: 800_000, volCeil: 5_200_000, drift: 0.09 },
  { symbol: "USDe", name: "USDe (Monad)", address: "0x0000000000000000000000000000000000000015", narrative: "Stable", chain: "Monad", monadRelated: true, holders: 21400, whaleConcentration: 0.24, basePrice: 1.0, volFloor: 12_000_000, volCeil: 40_000_000, drift: 0.003 },
];

const GLOBAL_TOKENS: SeedToken[] = [
  { symbol: "BTC", name: "Bitcoin", address: "btc", narrative: "Major", chain: "External", holders: 55_000_000, whaleConcentration: 0.42, basePrice: 98_400, volFloor: 22_000_000_000, volCeil: 48_000_000_000, drift: 0.04 },
  { symbol: "ETH", name: "Ethereum", address: "eth", narrative: "L1", chain: "External", holders: 118_000_000, whaleConcentration: 0.38, basePrice: 3_620, volFloor: 12_000_000_000, volCeil: 26_000_000_000, drift: 0.05 },
  { symbol: "SOL", name: "Solana", address: "sol", narrative: "L1", chain: "External", holders: 4_800_000, whaleConcentration: 0.44, basePrice: 214, volFloor: 3_000_000_000, volCeil: 9_000_000_000, drift: 0.08 },
  { symbol: "BNB", name: "BNB", address: "bnb", narrative: "Major", chain: "External", holders: 6_200_000, whaleConcentration: 0.51, basePrice: 712, volFloor: 900_000_000, volCeil: 2_500_000_000, drift: 0.04 },
  { symbol: "XRP", name: "XRP", address: "xrp", narrative: "Major", chain: "External", holders: 5_400_000, whaleConcentration: 0.47, basePrice: 2.28, volFloor: 2_000_000_000, volCeil: 6_500_000_000, drift: 0.07 },
  { symbol: "DOGE", name: "Dogecoin", address: "doge", narrative: "Meme", chain: "External", holders: 7_100_000, whaleConcentration: 0.55, basePrice: 0.38, volFloor: 1_200_000_000, volCeil: 4_500_000_000, drift: 0.11 },
  { symbol: "TON", name: "Toncoin", address: "ton", narrative: "L1", chain: "External", holders: 3_900_000, whaleConcentration: 0.48, basePrice: 5.62, volFloor: 300_000_000, volCeil: 1_100_000_000, drift: 0.08 },
  { symbol: "AVAX", name: "Avalanche", address: "avax", narrative: "L1", chain: "External", holders: 1_800_000, whaleConcentration: 0.46, basePrice: 42.1, volFloor: 400_000_000, volCeil: 1_400_000_000, drift: 0.09 },
  { symbol: "LINK", name: "Chainlink", address: "link", narrative: "Infra", chain: "External", holders: 700_000, whaleConcentration: 0.5, basePrice: 22.4, volFloor: 500_000_000, volCeil: 1_800_000_000, drift: 0.08 },
  { symbol: "ARB", name: "Arbitrum", address: "arb", narrative: "L2", chain: "External", holders: 1_400_000, whaleConcentration: 0.44, basePrice: 0.82, volFloor: 250_000_000, volCeil: 900_000_000, drift: 0.1 },
  { symbol: "OP", name: "Optimism", address: "op", narrative: "L2", chain: "External", holders: 900_000, whaleConcentration: 0.41, basePrice: 1.71, volFloor: 200_000_000, volCeil: 780_000_000, drift: 0.1 },
  { symbol: "SUI", name: "Sui", address: "sui", narrative: "L1", chain: "External", holders: 1_100_000, whaleConcentration: 0.5, basePrice: 4.28, volFloor: 400_000_000, volCeil: 1_300_000_000, drift: 0.11 },
  { symbol: "APT", name: "Aptos", address: "apt", narrative: "L1", chain: "External", holders: 620_000, whaleConcentration: 0.52, basePrice: 11.3, volFloor: 220_000_000, volCeil: 700_000_000, drift: 0.09 },
  { symbol: "PEPE", name: "Pepe", address: "pepe", narrative: "Meme", chain: "External", holders: 340_000, whaleConcentration: 0.62, basePrice: 0.0000213, volFloor: 600_000_000, volCeil: 2_100_000_000, drift: 0.22 },
  { symbol: "WIF", name: "dogwifhat", address: "wif", narrative: "Meme", chain: "External", holders: 240_000, whaleConcentration: 0.6, basePrice: 3.14, volFloor: 400_000_000, volCeil: 1_400_000_000, drift: 0.2 },
  { symbol: "USDT", name: "Tether", address: "usdt", narrative: "Stable", chain: "External", holders: 6_000_000, whaleConcentration: 0.3, basePrice: 1.0, volFloor: 40_000_000_000, volCeil: 90_000_000_000, drift: 0.001 },
  { symbol: "USDC", name: "USD Coin", address: "usdc", narrative: "Stable", chain: "External", holders: 2_800_000, whaleConcentration: 0.28, basePrice: 1.0, volFloor: 8_000_000_000, volCeil: 22_000_000_000, drift: 0.001 },
];

const SEED_TOKENS: SeedToken[] = [...MONAD_TOKENS, ...MONAD_TOKENS_EXTRA, ...GLOBAL_TOKENS];

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function getMarketState(now = Date.now()): MarketState {
  const bucket = Math.floor(now / 120_000);
  const rand = seeded(bucket);
  const live = getBinanceCache();
  const monLive = live["MON"]?.price;
  const tokens: MonadToken[] = SEED_TOKENS.map((t) => {
    const drift = (rand() - 0.45) * t.drift;
    // Real live price if Binance has it; MON siblings (wMON/sMON/iMON/rMON) mirror MON.
    const monSibling = ["wMON", "sMON", "iMON", "rMON"].includes(t.symbol);
    const liveQuote = live[t.symbol];
    const basePrice =
      liveQuote?.price ??
      (monSibling && monLive ? monLive : t.basePrice);
    const priceUsd = liveQuote
      ? +liveQuote.price.toFixed(liveQuote.price < 0.0001 ? 10 : liveQuote.price < 0.01 ? 8 : liveQuote.price < 1 ? 4 : 2)
      : +(basePrice * (1 + drift)).toFixed(basePrice < 0.01 ? 8 : basePrice < 1 ? 4 : 2);
    const change24h = liveQuote
      ? +liveQuote.change24h.toFixed(2)
      : +(drift * 100).toFixed(2);
    const volume24hUsd = Math.round(t.volFloor + rand() * (t.volCeil - t.volFloor));
    const liquidityUsd = Math.round(volume24hUsd * (0.4 + rand() * 0.9));
    const marketCapUsd = Math.round(priceUsd * (t.holders * (200 + rand() * 800)));
    const momentum = +(Math.tanh(change24h / 8) + (rand() - 0.5) * 0.2).toFixed(2);
    const { basePrice: _b, volFloor: _f, volCeil: _c, drift: _d, ...rest } = t;
    void _b; void _f; void _c; void _d;
    return { ...rest, priceUsd, change24h, volume24hUsd, liquidityUsd, marketCapUsd, momentum };
  });

  const whales: WhaleEvent[] = Array.from({ length: 6 }, (_, i) => {
    const tk = tokens[Math.floor(rand() * tokens.length)];
    const actions: WhaleEvent["action"][] = ["accumulate", "distribute", "rotate"];
    return {
      wallet: `0x${Math.floor(rand() * 0xffffffff).toString(16).padStart(8, "0")}…${Math.floor(rand() * 0xffff).toString(16).padStart(4, "0")}`,
      action: actions[Math.floor(rand() * 3)],
      token: tk.symbol,
      amountUsd: Math.round(50_000 + rand() * 1_800_000),
      minutesAgo: Math.round(1 + rand() * 45 + i * 4),
    };
  }).sort((a, b) => a.minutesAgo - b.minutesAgo);

  const narratives = [
    { name: "AI", strength: 0.5 + rand() * 0.5, change: (rand() - 0.3) * 25 },
    { name: "DeFi", strength: 0.4 + rand() * 0.5, change: (rand() - 0.4) * 15 },
    { name: "LST", strength: 0.35 + rand() * 0.4, change: (rand() - 0.35) * 12 },
    { name: "Meme", strength: 0.3 + rand() * 0.6, change: (rand() - 0.5) * 40 },
    { name: "Infra", strength: 0.55 + rand() * 0.35, change: (rand() - 0.5) * 8 },
  ].map((n) => ({ ...n, strength: +n.strength.toFixed(2), change: +n.change.toFixed(1) }));

  return {
    generatedAt: new Date(bucket * 120_000).toISOString(),
    bucketMinute: bucket,
    ecosystem: {
      totalTvlUsd: Math.round(180_000_000 + rand() * 40_000_000),
      dexVolume24hUsd: Math.round(70_000_000 + rand() * 30_000_000),
      activeWallets24h: Math.round(120_000 + rand() * 40_000),
      txCount24h: Math.round(4_800_000 + rand() * 800_000),
      stablecoinInflow24hUsd: Math.round((rand() - 0.4) * 20_000_000),
    },
    tokens,
    whales,
    narratives,
  };
}

export function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}