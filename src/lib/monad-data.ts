// Synthetic-but-realistic Monad testnet market state.
// Deterministic per 2-minute bucket so the UI feels live but demo-stable.
// Wire to a real indexer (Envio/Goldsky) post-hackathon by swapping getMarketState().

export type MonadToken = {
  symbol: string;
  name: string;
  address: string;
  narrative: "AI" | "DeFi" | "Meme" | "Infra" | "LST" | "Stable";
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

const SEED_TOKENS: Omit<MonadToken, "priceUsd" | "change24h" | "volume24hUsd" | "liquidityUsd" | "marketCapUsd" | "momentum">[] = [
  { symbol: "MON", name: "Monad", address: "0x0000000000000000000000000000000000000000", narrative: "Infra", holders: 148230, whaleConcentration: 0.31 },
  { symbol: "wMON", name: "Wrapped Monad", address: "0x0000000000000000000000000000000000000001", narrative: "Infra", holders: 42110, whaleConcentration: 0.28 },
  { symbol: "aiMON", name: "Aether Monad", address: "0x0000000000000000000000000000000000000002", narrative: "AI", holders: 8210, whaleConcentration: 0.42 },
  { symbol: "NAD", name: "Nadmind", address: "0x0000000000000000000000000000000000000003", narrative: "AI", holders: 6320, whaleConcentration: 0.55 },
  { symbol: "MDX", name: "MonadDex", address: "0x0000000000000000000000000000000000000004", narrative: "DeFi", holders: 12480, whaleConcentration: 0.36 },
  { symbol: "sMON", name: "Staked Monad", address: "0x0000000000000000000000000000000000000005", narrative: "LST", holders: 21030, whaleConcentration: 0.29 },
  { symbol: "GECKO", name: "Monad Gecko", address: "0x0000000000000000000000000000000000000006", narrative: "Meme", holders: 3420, whaleConcentration: 0.61 },
  { symbol: "PARA", name: "Parallax", address: "0x0000000000000000000000000000000000000007", narrative: "Infra", holders: 5210, whaleConcentration: 0.44 },
  { symbol: "LEND", name: "Monad Lend", address: "0x0000000000000000000000000000000000000008", narrative: "DeFi", holders: 7040, whaleConcentration: 0.33 },
  { symbol: "USDm", name: "USD Monad", address: "0x0000000000000000000000000000000000000009", narrative: "Stable", holders: 54210, whaleConcentration: 0.22 },
];

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
  const tokens: MonadToken[] = SEED_TOKENS.map((t, i) => {
    const basePrice = [3.42, 3.44, 0.87, 0.24, 1.62, 3.51, 0.0043, 0.71, 0.19, 1.0][i];
    const drift = (rand() - 0.45) * (t.narrative === "Meme" ? 0.28 : t.narrative === "AI" ? 0.14 : t.narrative === "Stable" ? 0.002 : 0.08);
    const priceUsd = +(basePrice * (1 + drift)).toFixed(basePrice < 0.01 ? 6 : 4);
    const change24h = +(drift * 100).toFixed(2);
    const volume24hUsd = Math.round((5_000_000 + rand() * 45_000_000) * (t.narrative === "Meme" ? 0.4 : 1));
    const liquidityUsd = Math.round(volume24hUsd * (0.4 + rand() * 0.9));
    const marketCapUsd = Math.round(priceUsd * (t.holders * (200 + rand() * 800)));
    const momentum = +(Math.tanh(change24h / 8) + (rand() - 0.5) * 0.2).toFixed(2);
    return { ...t, priceUsd, change24h, volume24hUsd, liquidityUsd, marketCapUsd, momentum };
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