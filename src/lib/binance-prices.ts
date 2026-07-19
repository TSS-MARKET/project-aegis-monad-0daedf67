// Live spot prices from Binance public API. No auth required.
// Overlays real prices onto monad-data.ts SEED_TOKENS so the entire
// platform (ticker, radar, dashboard, digest, chat context) reflects
// real market data instead of drifted seed values.

const SYMBOL_MAP: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  BNB: "BNBUSDT",
  XRP: "XRPUSDT",
  DOGE: "DOGEUSDT",
  TON: "TONUSDT",
  AVAX: "AVAXUSDT",
  LINK: "LINKUSDT",
  ARB: "ARBUSDT",
  OP: "OPUSDT",
  SUI: "SUIUSDT",
  APT: "APTUSDT",
  PEPE: "PEPEUSDT",
  WIF: "WIFUSDT",
  MON: "MONUSDT",
};

export type BinanceQuote = { price: number; change24h: number; volume24h: number };

let cache: Record<string, BinanceQuote> = {};
let lastFetch = 0;
let inflight: Promise<Record<string, BinanceQuote>> | null = null;
const listeners = new Set<() => void>();

export function subscribeBinance(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getBinanceCache(): Record<string, BinanceQuote> {
  return cache;
}

export function getBinanceQuote(symbol: string): BinanceQuote | undefined {
  return cache[symbol];
}

export async function fetchBinancePrices(force = false): Promise<Record<string, BinanceQuote>> {
  const now = Date.now();
  if (!force && now - lastFetch < 20_000 && Object.keys(cache).length > 0) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const symbols = JSON.stringify(Object.values(SYMBOL_MAP));
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return cache;
      const arr = (await r.json()) as Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        quoteVolume: string;
      }>;
      const reverse: Record<string, string> = {};
      for (const [k, v] of Object.entries(SYMBOL_MAP)) reverse[v] = k;
      const next: Record<string, BinanceQuote> = { ...cache };
      for (const row of arr) {
        const key = reverse[row.symbol];
        if (!key) continue;
        const price = parseFloat(row.lastPrice);
        if (!Number.isFinite(price) || price <= 0) continue;
        next[key] = {
          price,
          change24h: parseFloat(row.priceChangePercent) || 0,
          volume24h: parseFloat(row.quoteVolume) || 0,
        };
      }
      cache = next;
      lastFetch = now;
      listeners.forEach((l) => {
        try { l(); } catch {}
      });
    } catch {
      // Network failure — keep last known cache
    } finally {
      inflight = null;
    }
    return cache;
  })();
  return inflight;
}

// Auto-refresh in browser
if (typeof window !== "undefined") {
  fetchBinancePrices(true);
  setInterval(() => { fetchBinancePrices(true); }, 20_000);
}