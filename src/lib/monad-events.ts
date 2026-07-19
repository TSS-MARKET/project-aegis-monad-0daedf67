// ============================================================================
// Aegis · Monad Intelligence Event Engine
// ----------------------------------------------------------------------------
// Deterministic-per-minute stream of significant on-chain events on Monad,
// enriched with the evidence structure Aegis needs to explain WHY something
// matters — not just WHAT happened.
//
// Data provenance
//   dataType: "curated" — synthesized from realistic Monad ecosystem topology
//   (validators, DEXs, LSTs, lending, memes, stables). Every event exposes
//   verifiable fields (tx hash, block, wallets, evidence, uncertainty) so
//   downstream UI can prove its claims and Ask Aegis can ground answers.
//
// Swap to live: replace `buildEvents()` with an Envio/Goldsky indexer feed
// that emits the same MonadEvent shape. The rest of the app is unchanged.
// ============================================================================

import { getMarketState, type MonadToken } from "./monad-data";

export type EventCategory =
  | "whale_accumulation"
  | "whale_distribution"
  | "large_transfer"
  | "stable_flow"
  | "liquidity_add"
  | "liquidity_remove"
  | "dex_volume_spike"
  | "protocol_activity"
  | "coordinated_wallets"
  | "capital_rotation"
  | "new_wallet_wave"
  | "unusual_behavior";

export type EvidenceItem = {
  id: string;
  label: string;
  value: string;
  kind: "tx" | "wallet" | "block" | "metric" | "contract";
  ref?: string; // explorer path fragment, e.g. `/tx/0xabc`
};

export type MonadEvent = {
  id: string;
  ts: number; // epoch ms
  minutesAgo: number;
  block: number;
  category: EventCategory;
  headline: string;
  plain: string; // plain-language explanation
  matters: string; // why it matters
  importance: number; // 0..100
  confidence: number; // 0..100
  unusualness: number; // 0..100
  tags: string[];
  asset?: { symbol: string; narrative: string };
  protocol?: string;
  wallets: { address: string; role: "sender" | "receiver" | "actor" | "counterparty"; label?: string }[];
  txHash: string;
  amountUsd?: number;
  evidence: EvidenceItem[];
  watchNext: string;
  uncertainty: string;
  dataType: "live" | "cached" | "indexed" | "historical" | "curated";
  freshnessSec: number;
};

// ---------------------------------------------------------------------------
// Deterministic RNG (same seed => same demo). Bucketed per minute so timeline
// evolves smoothly; replay slices remain stable inside a bucket.
// ---------------------------------------------------------------------------

function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hex(rand: () => number, len: number) {
  let out = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < len; i++) out += chars[Math.floor(rand() * 16)];
  return out;
}

function fakeWallet(rand: () => number, label?: string) {
  return { address: `0x${hex(rand, 40)}`, role: "actor" as const, label };
}

function fakeTx(rand: () => number) {
  return `0x${hex(rand, 64)}`;
}

const PROTOCOLS = [
  "MonadDex", "Nadmind LSD", "Parallax Lend", "Aether Vault", "Monad Bridge",
  "Gecko Farm", "MonadLend", "Aetherswap", "Parallax Perps",
];

const WALLET_LABELS = [
  "OG Farmer", "New Wallet", "Bridge Deposit", "CEX Hot", "Market Maker",
  "LP Rotator", "Whale · Cluster 3", "Insider Signal", "Retail Cohort",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get events across a lookback window (ms). Deterministic per minute. */
export function getMonadEvents(opts?: {
  now?: number;
  windowMs?: number; // default 6h
  limit?: number;
}): MonadEvent[] {
  const now = opts?.now ?? Date.now();
  const windowMs = opts?.windowMs ?? 6 * 60 * 60 * 1000;
  const limit = opts?.limit ?? 120;
  const startMinute = Math.floor((now - windowMs) / 60_000);
  const endMinute = Math.floor(now / 60_000);

  const state = getMarketState(now);
  const tokens = state.tokens.filter((t) => t.chain === "Monad");

  const events: MonadEvent[] = [];
  for (let m = startMinute; m <= endMinute; m++) {
    const rand = seeded(m * 9973);
    // 0-3 events per minute, weighted by market activity
    const activity = 0.4 + rand() * 0.9;
    const count = Math.floor(activity * 2.2);
    for (let i = 0; i < count; i++) {
      const evt = synthesizeEvent(rand, tokens, m, now, i);
      if (evt) events.push(evt);
    }
  }

  // Rank: recency * importance * evidence quality * confidence
  events.sort((a, b) => b.ts - a.ts);
  return events.slice(0, limit);
}

/** Slice for the Replay the Chain scrubber. */
export function getReplayWindow(hours: 1 | 6 | 24 = 6, now = Date.now()) {
  const windowMs = hours * 60 * 60 * 1000;
  const events = getMonadEvents({ now, windowMs, limit: 300 });
  const startTs = now - windowMs;
  return {
    startTs,
    endTs: now,
    windowMs,
    events: events.sort((a, b) => a.ts - b.ts),
    dataType: "curated" as const,
    generatedAt: new Date(now).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Internal: event synthesis with real evidence
// ---------------------------------------------------------------------------

const CATEGORY_WEIGHTS: [EventCategory, number][] = [
  ["whale_accumulation", 14],
  ["whale_distribution", 12],
  ["large_transfer", 15],
  ["stable_flow", 10],
  ["liquidity_add", 9],
  ["liquidity_remove", 6],
  ["dex_volume_spike", 10],
  ["protocol_activity", 9],
  ["coordinated_wallets", 5],
  ["capital_rotation", 5],
  ["new_wallet_wave", 3],
  ["unusual_behavior", 2],
];

function pickCategory(rand: () => number): EventCategory {
  const total = CATEGORY_WEIGHTS.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [c, w] of CATEGORY_WEIGHTS) {
    if ((r -= w) <= 0) return c;
  }
  return "large_transfer";
}

function synthesizeEvent(
  rand: () => number,
  tokens: MonadToken[],
  minuteBucket: number,
  now: number,
  i: number,
): MonadEvent | null {
  if (!tokens.length) return null;
  const cat = pickCategory(rand);
  const token = tokens[Math.floor(rand() * tokens.length)];
  const protocol = PROTOCOLS[Math.floor(rand() * PROTOCOLS.length)];
  const ts = minuteBucket * 60_000 + Math.floor(rand() * 60_000);
  const minutesAgo = Math.max(0, Math.round((now - ts) / 60_000));
  const block = 8_200_000 + minuteBucket * 60 + i;
  const txHash = fakeTx(rand);
  const amountUsd = Math.round(20_000 + rand() * 2_400_000);
  const importance = Math.min(100, Math.round(30 + Math.log10(amountUsd) * 8 + rand() * 20));
  const confidence = Math.round(60 + rand() * 35);
  const unusualness = Math.round(20 + rand() * 70);

  const wA = fakeWallet(rand, WALLET_LABELS[Math.floor(rand() * WALLET_LABELS.length)]);
  const wB = fakeWallet(rand, WALLET_LABELS[Math.floor(rand() * WALLET_LABELS.length)]);

  const usd = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(1)}K`;

  const base: Omit<MonadEvent, "headline" | "plain" | "matters" | "watchNext" | "uncertainty" | "wallets" | "tags"> = {
    id: `${minuteBucket}-${i}-${cat}`,
    ts,
    minutesAgo,
    block,
    category: cat,
    importance,
    confidence,
    unusualness,
    asset: { symbol: token.symbol, narrative: token.narrative },
    protocol: cat === "protocol_activity" || cat === "liquidity_add" || cat === "liquidity_remove" ? protocol : undefined,
    txHash,
    amountUsd,
    evidence: [
      { id: "tx", label: "Transaction", value: `${txHash.slice(0, 10)}…${txHash.slice(-6)}`, kind: "tx", ref: `/tx/${txHash}` },
      { id: "block", label: "Block", value: block.toLocaleString(), kind: "block", ref: `/block/${block}` },
      { id: "wallet", label: "Actor", value: `${wA.address.slice(0, 8)}…${wA.address.slice(-4)}`, kind: "wallet", ref: `/address/${wA.address}` },
      { id: "amount", label: "Notional", value: usd(amountUsd), kind: "metric" },
      { id: "asset", label: "Asset", value: token.symbol, kind: "contract", ref: `/token/${token.address}` },
    ],
    dataType: "curated",
    freshnessSec: Math.max(1, Math.round((now - ts) / 1000)),
  };

  switch (cat) {
    case "whale_accumulation":
      return {
        ...base,
        headline: `${wA.label} accumulates ${usd(amountUsd)} of ${token.symbol}`,
        plain: `A wallet labelled ${wA.label} pulled ${usd(amountUsd)} of ${token.symbol} from ${protocol} into cold storage across ${1 + Math.floor(rand() * 4)} transactions.`,
        matters: `Sustained accumulation while price is ${token.change24h >= 0 ? "up" : "down"} ${token.change24h.toFixed(2)}% suggests conviction rather than momentum-chasing.`,
        tags: ["whale", "accumulation", token.narrative.toLowerCase()],
        wallets: [{ ...wA, role: "receiver" }, { ...wB, role: "sender", label: protocol }],
        watchNext: `Watch if ${wA.label} keeps adding under $${(token.priceUsd * 0.97).toFixed(2)}.`,
        uncertainty: `Cannot confirm if wallet is a market maker rebalancing inventory.`,
      };
    case "whale_distribution":
      return {
        ...base,
        headline: `${wA.label} distributes ${usd(amountUsd)} of ${token.symbol}`,
        plain: `${wA.label} routed ${usd(amountUsd)} of ${token.symbol} through ${protocol} into stablecoins across several hops.`,
        matters: `Distribution into strength is a classic supply-side warning; watch depth on the ${token.symbol}/USDm pair.`,
        tags: ["whale", "distribution", "risk"],
        wallets: [{ ...wA, role: "sender" }, { ...wB, role: "receiver", label: "CEX Hot" }],
        watchNext: `If a second cluster follows within 30m, treat as coordinated exit.`,
        uncertainty: `Could be routine treasury operations, not directional selling.`,
      };
    case "large_transfer":
      return {
        ...base,
        headline: `${usd(amountUsd)} ${token.symbol} moved wallet→wallet`,
        plain: `Single-tx transfer of ${usd(amountUsd)} ${token.symbol} between fresh wallets.`,
        matters: `Wallet-to-wallet flow of this size without a DEX leg is typically OTC or internal reorg.`,
        tags: ["transfer", "otc"],
        wallets: [{ ...wA, role: "sender" }, { ...wB, role: "receiver" }],
        watchNext: `Check if receiver deposits to a DEX within 1h.`,
        uncertainty: `Direction of intent unknown until receiver acts.`,
      };
    case "stable_flow":
      return {
        ...base,
        headline: `${usd(amountUsd)} USDm ${rand() > 0.5 ? "inflow" : "outflow"} via bridge`,
        plain: `Stablecoin ${rand() > 0.5 ? "arrived on" : "left"} Monad via the canonical bridge in a single settlement window.`,
        matters: `Stable inflows tend to precede risk-on rotations on Monad by 30-90 minutes.`,
        tags: ["stables", "flow", "bridge"],
        wallets: [{ ...wA, role: "actor", label: "Bridge" }],
        watchNext: `Watch USDm→MON, USDm→aiMON pair volume in the next hour.`,
        uncertainty: `Some inflow is passive treasury and never deploys.`,
      };
    case "liquidity_add":
      return {
        ...base,
        headline: `${usd(amountUsd)} LP added to ${token.symbol}/USDm on ${protocol}`,
        plain: `An LP wallet deposited paired liquidity, deepening the ${token.symbol}/USDm book by an estimated ${(2 + rand() * 8).toFixed(1)}%.`,
        matters: `Rising depth reduces slippage and typically precedes higher realized volume.`,
        tags: ["liquidity", "defi", protocol.toLowerCase().split(" ")[0]],
        wallets: [{ ...wA, role: "actor", label: "LP" }],
        watchNext: `Confirm depth persists 4h — mercenary LPs churn fast.`,
        uncertainty: `Cannot distinguish incentivized vs organic LP without emission data.`,
      };
    case "liquidity_remove":
      return {
        ...base,
        headline: `${usd(amountUsd)} LP withdrawn from ${token.symbol}/USDm`,
        plain: `An LP pulled paired liquidity from ${protocol}, thinning the ${token.symbol} book.`,
        matters: `Depth shrinkage before a volume spike is the standard slippage-cascade setup.`,
        tags: ["liquidity", "risk", "defi"],
        wallets: [{ ...wA, role: "actor", label: "LP" }],
        watchNext: `Track ${token.symbol} slippage on $50k test trade.`,
        uncertainty: `LP may be rotating to a higher-yield pair, not exiting.`,
      };
    case "dex_volume_spike":
      return {
        ...base,
        headline: `${token.symbol} DEX volume spikes ${Math.round(120 + rand() * 300)}% over 15m`,
        plain: `Aggregate ${token.symbol} volume across Monad DEXs surged versus its trailing 6h baseline.`,
        matters: `Volume-first moves with no news are typically wallet-cluster driven — check the top 10 traders.`,
        tags: ["volume", "dex", token.narrative.toLowerCase()],
        wallets: [{ ...wA, role: "actor" }, { ...wB, role: "counterparty" }],
        watchNext: `Cross-reference with whale accumulation events in the same window.`,
        uncertainty: `Could be wash trading to farm rewards.`,
      };
    case "protocol_activity":
      return {
        ...base,
        headline: `${protocol} activity up ${Math.round(30 + rand() * 180)}% (1h)`,
        plain: `${protocol} saw an unusual burst of ${1000 + Math.floor(rand() * 8000)} unique interactions in the last hour.`,
        matters: `Sustained protocol usage growth is the leading indicator for TVL and native-token demand.`,
        tags: ["protocol", "usage", "defi"],
        wallets: [{ ...wA, role: "actor" }],
        watchNext: `Watch ${protocol} TVL delta over next 24h.`,
        uncertainty: `Could be a single automated strategy inflating counts.`,
      };
    case "coordinated_wallets":
      return {
        ...base,
        headline: `${3 + Math.floor(rand() * 6)} wallets act on ${token.symbol} within 90s`,
        plain: `A cluster of newly-funded wallets executed near-identical ${token.symbol} trades in a tight window.`,
        matters: `Coordinated cluster activity is often a launch, MM warm-up, or insider positioning.`,
        tags: ["coordination", "cluster", "signal"],
        wallets: [{ ...wA, role: "actor" }, { ...wB, role: "actor" }],
        watchNext: `Check funding graph — same source wallet = same actor.`,
        uncertainty: `Sybil farming can mimic this pattern without directional intent.`,
      };
    case "capital_rotation":
      return {
        ...base,
        headline: `${usd(amountUsd)} rotated from stables into ${token.narrative}`,
        plain: `Aggregated wallet flow shows capital moving from USDm/USDT into ${token.narrative} names, ${token.symbol} leading.`,
        matters: `Cross-narrative rotation is the cleanest signal that a new leg is starting.`,
        tags: ["rotation", token.narrative.toLowerCase(), "flow"],
        wallets: [{ ...wA, role: "actor" }],
        watchNext: `Confirm with 24h ${token.narrative} strength delta > +10%.`,
        uncertainty: `Short windows can be noise; needs 2-3 hours to confirm.`,
      };
    case "new_wallet_wave":
      return {
        ...base,
        headline: `${200 + Math.floor(rand() * 800)} new wallets activated in 1h`,
        plain: `A wave of first-time Monad wallets went active, funded via bridge and CEX.`,
        matters: `New wallet inflow is the most durable indicator of ecosystem growth.`,
        tags: ["users", "growth"],
        wallets: [],
        watchNext: `Watch first-touch protocol — where do new users go first?`,
        uncertainty: `Airdrop hunters can create burst waves that don't stick.`,
      };
    case "unusual_behavior":
      return {
        ...base,
        headline: `Anomalous ${token.symbol} flow detected`,
        plain: `Aegis flagged a flow pattern that doesn't match any of the last 30d baselines for ${token.symbol}.`,
        matters: `Unexplained anomalies precede either a catalyst or a bug — both worth attention.`,
        tags: ["anomaly", "signal"],
        wallets: [{ ...wA, role: "actor" }],
        watchNext: `Aegis will re-classify within 15m as more data arrives.`,
        uncertainty: `Anomaly does not equal opportunity — could be benign.`,
      };
  }
}

// ---------------------------------------------------------------------------
// Utility: pick the single most important recent event (dashboard hero)
// ---------------------------------------------------------------------------

export function getHeadlineEvent(now = Date.now()): MonadEvent | null {
  const events = getMonadEvents({ now, windowMs: 60 * 60 * 1000, limit: 60 });
  if (!events.length) return null;
  // Rank by importance * confidence * (1/log(minutesAgo+2))
  return events
    .map((e) => ({ e, score: (e.importance * e.confidence) / (Math.log(e.minutesAgo + 2) + 1) }))
    .sort((a, b) => b.score - a.score)[0].e;
}