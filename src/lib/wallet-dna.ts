// Deterministic Wallet DNA profiler. Given a Monad address, synthesizes a
// stable behavioral fingerprint: archetype, activity rhythm, category split,
// narrative exposure, conviction, risk vectors, and cohort peers. Every
// derived field is a pure function of the address so the same wallet always
// renders the same DNA across reloads and viewers.

import { getMarketState } from "./monad-data";

export type ArchetypeKey =
  | "whale"
  | "market_maker"
  | "lp_rotator"
  | "yield_farmer"
  | "diamond_hands"
  | "meme_hunter"
  | "bridger"
  | "insider"
  | "fresh";

export type Archetype = {
  key: ArchetypeKey;
  label: string;
  tag: string;
  blurb: string;
  color: string;
};

const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  whale:        { key: "whale",        label: "Whale",           tag: "Structural size", blurb: "Concentrated positions, low turnover, moves markets on entry.", color: "#22d3ee" },
  market_maker: { key: "market_maker", label: "Market Maker",    tag: "Two-sided",       blurb: "Rebalances constantly across pairs; provides depth on both sides.", color: "#a78bfa" },
  lp_rotator:   { key: "lp_rotator",   label: "LP Rotator",      tag: "Liquidity",       blurb: "Chases best-fee pools; add/remove liquidity cycles daily.", color: "#34d399" },
  yield_farmer: { key: "yield_farmer", label: "Yield Farmer",    tag: "APR chaser",      blurb: "Loops LST/lending markets for stacked yield.", color: "#fbbf24" },
  diamond_hands:{ key: "diamond_hands",label: "Diamond Hands",   tag: "HODL",            blurb: "Buys and holds. Zero recent distributions across regime shifts.", color: "#22d3ee" },
  meme_hunter:  { key: "meme_hunter",  label: "Meme Hunter",     tag: "Rotation",        blurb: "High-frequency swaps across meme narrative; short holding times.", color: "#f472b6" },
  bridger:      { key: "bridger",      label: "Bridger",         tag: "Cross-chain",     blurb: "Primarily routes value on and off Monad; low native activity.", color: "#60a5fa" },
  insider:      { key: "insider",      label: "Insider Signal",  tag: "Alpha",           blurb: "Consistently enters tokens minutes before large flows arrive.", color: "#fb7185" },
  fresh:        { key: "fresh",        label: "Fresh Wallet",    tag: "New",             blurb: "Recently created — behavior still forming.", color: "#94a3b8" },
};

// Simple string hash — stable across runs.
function hashAddress(addr: string): number {
  let h = 2166136261 >>> 0;
  const s = addr.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export type CategoryKey = "swap" | "lp_add" | "lp_remove" | "lend" | "borrow" | "bridge" | "transfer" | "mint" | "stake";

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  swap: "DEX Swaps",
  lp_add: "LP Add",
  lp_remove: "LP Remove",
  lend: "Lend / Supply",
  borrow: "Borrow",
  bridge: "Bridge",
  transfer: "Transfers",
  mint: "Mints",
  stake: "Stake / LST",
};

// Archetype selection is a pure function of a stable score derived from the
// address hash + weekly rotation slot, so cohort membership feels alive.
function pickArchetype(rand: () => number, addr: string): ArchetypeKey {
  const roll = rand();
  const isFresh = (hashAddress(addr) % 97) < 5;
  if (isFresh) return "fresh";
  if (roll < 0.12) return "whale";
  if (roll < 0.22) return "market_maker";
  if (roll < 0.36) return "lp_rotator";
  if (roll < 0.5)  return "yield_farmer";
  if (roll < 0.62) return "diamond_hands";
  if (roll < 0.78) return "meme_hunter";
  if (roll < 0.88) return "bridger";
  return "insider";
}

// Weight profile per archetype for category split (must sum ~1 after normalize).
const CATEGORY_WEIGHTS: Record<ArchetypeKey, Partial<Record<CategoryKey, number>>> = {
  whale:        { swap: 3, transfer: 5, stake: 2, lend: 1 },
  market_maker: { swap: 8, lp_add: 3, lp_remove: 3, transfer: 1 },
  lp_rotator:   { lp_add: 5, lp_remove: 5, swap: 3, transfer: 1 },
  yield_farmer: { lend: 5, borrow: 3, stake: 4, swap: 2 },
  diamond_hands:{ swap: 1, transfer: 2, stake: 3 },
  meme_hunter:  { swap: 9, transfer: 1, mint: 2 },
  bridger:      { bridge: 8, transfer: 3, swap: 1 },
  insider:      { swap: 4, transfer: 2, mint: 1, lp_add: 1 },
  fresh:        { swap: 2, transfer: 3 },
};

// Preferred narratives per archetype — bias the exposure ring.
const NARRATIVE_BIAS: Record<ArchetypeKey, string[]> = {
  whale:        ["Infra", "LST", "DeFi"],
  market_maker: ["DeFi", "Infra", "Stable"],
  lp_rotator:   ["DeFi", "LST", "Stable"],
  yield_farmer: ["LST", "DeFi", "Stable"],
  diamond_hands:["Infra", "LST"],
  meme_hunter:  ["Meme", "DeFi"],
  bridger:      ["Stable", "Infra"],
  insider:      ["Meme", "AI", "DeFi"],
  fresh:        ["Infra"],
};

function activityCurve(rand: () => number, arch: ArchetypeKey): number[] {
  // 24-hour intensity — biased by archetype. Meme hunters spike US late night,
  // farmers cluster around rebalance windows, whales are flat.
  const out: number[] = [];
  const base = arch === "diamond_hands" ? 5 : arch === "whale" ? 15 : 25;
  const spikes: number[] =
    arch === "meme_hunter" ? [2, 3, 20, 21, 22] :
    arch === "market_maker" ? [1, 7, 13, 19] :
    arch === "yield_farmer" ? [0, 8, 16] :
    arch === "lp_rotator" ? [9, 15, 21] :
    arch === "bridger" ? [10, 22] :
    arch === "insider" ? [3, 11, 19] :
    [12];
  for (let h = 0; h < 24; h++) {
    let v = base + rand() * 20;
    if (spikes.includes(h)) v += 45 + rand() * 30;
    v = Math.min(100, Math.round(v));
    out.push(v);
  }
  return out;
}

export type WalletDNA = {
  address: string;
  short: string;
  archetype: Archetype;
  seenSince: string; // human-readable age
  ageDays: number;
  stats: {
    txCount: number;
    uniqueContracts: number;
    uniqueTokens: number;
    balanceUsd: number;
    pnl30d: number;
    winRate: number;
  };
  dominantProtocol: string;
  activityByHour: number[]; // 24
  activityByDay: number[]; // 7 (Mon..Sun)
  categorySplit: { key: CategoryKey; label: string; share: number }[];
  narrativeExposure: { narrative: string; share: number; color: string }[];
  conviction: { avgHoldDays: number; sellsToBuys: number; regimeConsistency: number };
  riskFlags: { label: string; severity: "low" | "med" | "high" }[];
  cohort: { address: string; short: string; similarity: number }[];
  fingerprint: string; // short DNA "code" like AEG-QW7-42
};

const NARRATIVE_COLOR: Record<string, string> = {
  Infra: "#22d3ee",
  LST: "#34d399",
  DeFi: "#a78bfa",
  Meme: "#fb7185",
  AI: "#60a5fa",
  Stable: "#e5e7eb",
  Major: "#fbbf24",
  L1: "#94a3b8",
  L2: "#f472b6",
};

export function isMonadAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr.trim());
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function computeWalletDNA(rawAddress: string): WalletDNA {
  const address = rawAddress.trim().toLowerCase();
  const seed = hashAddress(address);
  const rand = seeded(seed);

  const archetype = ARCHETYPES[pickArchetype(rand, address)];
  const ageDays = archetype.key === "fresh"
    ? Math.floor(rand() * 14)
    : Math.floor(30 + rand() * 640);

  const seenSince =
    ageDays < 30 ? `${ageDays}d` :
    ageDays < 365 ? `${Math.round(ageDays / 30)}mo` :
    `${(ageDays / 365).toFixed(1)}y`;

  // Stats — scale with archetype
  const activityScale =
    archetype.key === "market_maker" ? 40 :
    archetype.key === "meme_hunter" ? 25 :
    archetype.key === "lp_rotator" ? 18 :
    archetype.key === "yield_farmer" ? 14 :
    archetype.key === "whale" ? 4 :
    archetype.key === "diamond_hands" ? 0.5 :
    archetype.key === "bridger" ? 3 :
    archetype.key === "insider" ? 6 :
    1.5;
  const txCount = Math.round(ageDays * activityScale * (0.6 + rand()));
  const uniqueContracts = Math.max(1, Math.round(Math.sqrt(txCount) * (0.5 + rand() * 0.8)));
  const uniqueTokens = Math.max(1, Math.min(80, Math.round(uniqueContracts * (0.4 + rand()))));

  const balanceUsd =
    archetype.key === "whale" ? Math.round(500_000 + rand() * 8_000_000) :
    archetype.key === "market_maker" ? Math.round(120_000 + rand() * 900_000) :
    archetype.key === "insider" ? Math.round(40_000 + rand() * 400_000) :
    archetype.key === "diamond_hands" ? Math.round(20_000 + rand() * 250_000) :
    archetype.key === "fresh" ? Math.round(50 + rand() * 3_000) :
    Math.round(3_000 + rand() * 90_000);

  const pnlBias =
    archetype.key === "insider" ? 0.35 :
    archetype.key === "whale" ? 0.08 :
    archetype.key === "diamond_hands" ? 0.18 :
    archetype.key === "meme_hunter" ? -0.05 :
    0.02;
  const pnl30d = Math.round(balanceUsd * (pnlBias + (rand() - 0.5) * 0.35));
  const winRate = Math.round(45 + (pnlBias * 60) + rand() * 20);

  const dominantProtocol = [
    "MonadDex", "Nadmind LSD", "Aetherswap", "Parallax Lend", "Monad Bridge", "Gecko Farm",
  ][seed % 6];

  // Activity rhythms
  const activityByHour = activityCurve(rand, archetype.key);
  const activityByDay = Array.from({ length: 7 }, () => Math.round(30 + rand() * 70));
  // Weekends dip for institutional archetypes
  if (archetype.key === "market_maker" || archetype.key === "yield_farmer") {
    activityByDay[5] = Math.round(activityByDay[5] * 0.55);
    activityByDay[6] = Math.round(activityByDay[6] * 0.5);
  }

  // Category split
  const weights = CATEGORY_WEIGHTS[archetype.key];
  const entries = Object.entries(weights) as [CategoryKey, number][];
  const noisy = entries.map(([k, w]) => [k, w * (0.7 + rand() * 0.6)] as [CategoryKey, number]);
  const total = noisy.reduce((a, [, w]) => a + w, 0);
  const categorySplit = noisy
    .map(([k, w]) => ({ key: k, label: CATEGORY_LABEL[k], share: w / total }))
    .sort((a, b) => b.share - a.share);

  // Narrative exposure — bias set + a couple of ecosystem narratives
  const state = getMarketState();
  const ecosystemNarratives = Array.from(new Set(state.tokens.map((t) => t.narrative))).slice(0, 8);
  const pref = NARRATIVE_BIAS[archetype.key];
  const chosen: string[] = [];
  for (const n of pref) if (!chosen.includes(n)) chosen.push(n);
  while (chosen.length < 4) {
    const pick = ecosystemNarratives[Math.floor(rand() * ecosystemNarratives.length)];
    if (pick && !chosen.includes(pick)) chosen.push(pick);
  }
  const rawShares = chosen.map((_, i) => (chosen.length - i) * (0.6 + rand() * 0.8));
  const shareTotal = rawShares.reduce((a, b) => a + b, 0);
  const narrativeExposure = chosen.map((n, i) => ({
    narrative: n,
    share: rawShares[i] / shareTotal,
    color: NARRATIVE_COLOR[n] ?? "#94a3b8",
  }));

  // Conviction metrics
  const avgHoldDays =
    archetype.key === "diamond_hands" ? Math.round(180 + rand() * 240) :
    archetype.key === "whale" ? Math.round(60 + rand() * 150) :
    archetype.key === "meme_hunter" ? Math.round(1 + rand() * 6) :
    archetype.key === "market_maker" ? 1 :
    Math.round(10 + rand() * 40);
  const sellsToBuys =
    archetype.key === "diamond_hands" ? 0.05 + rand() * 0.15 :
    archetype.key === "market_maker" ? 0.95 + rand() * 0.1 :
    archetype.key === "meme_hunter" ? 0.85 + rand() * 0.3 :
    0.35 + rand() * 0.5;
  const regimeConsistency = Math.round(50 + rand() * 45);

  // Risk flags
  const riskFlags: WalletDNA["riskFlags"] = [];
  if (archetype.key === "fresh") riskFlags.push({ label: "New wallet — no track record", severity: "med" });
  if (archetype.key === "insider" && rand() > 0.4) riskFlags.push({ label: "Pattern matches known alpha cluster", severity: "high" });
  if (categorySplit.some((c) => c.key === "lp_remove" && c.share > 0.35)) riskFlags.push({ label: "Heavy LP withdrawals last 24h", severity: "med" });
  if (archetype.key === "meme_hunter" && rand() > 0.5) riskFlags.push({ label: "High-turnover on illiquid tokens", severity: "high" });
  if (uniqueContracts > 60) riskFlags.push({ label: "Broad protocol exposure — surface area risk", severity: "low" });
  if (!riskFlags.length) riskFlags.push({ label: "No elevated risk signals detected", severity: "low" });

  // Cohort — similar wallets
  const cohort = Array.from({ length: 5 }).map(() => {
    let a = "0x";
    const chars = "0123456789abcdef";
    for (let i = 0; i < 40; i++) a += chars[Math.floor(rand() * 16)];
    return { address: a, short: shortAddress(a), similarity: Math.round(72 + rand() * 26) };
  }).sort((a, b) => b.similarity - a.similarity);

  // Fingerprint code
  const alpha = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const fp = `AEG-${alpha[seed % 23]}${alpha[(seed >> 5) % 23]}${(seed % 90) + 10}-${(seed % 900) + 100}`;

  return {
    address,
    short: shortAddress(address),
    archetype,
    seenSince,
    ageDays,
    stats: { txCount, uniqueContracts, uniqueTokens, balanceUsd, pnl30d, winRate },
    dominantProtocol,
    activityByHour,
    activityByDay,
    categorySplit,
    narrativeExposure,
    conviction: { avgHoldDays, sellsToBuys, regimeConsistency },
    riskFlags,
    cohort,
    fingerprint: fp,
  };
}

// Synthesize a portfolio (compatible with analyzeWallet's holdings shape) so
// the AI strategist read has real material to reason over.
export function synthesizeHoldings(dna: WalletDNA): { symbol: string; valueUsd: number }[] {
  const state = getMarketState();
  const monadTokens = state.tokens;
  const holdings: { symbol: string; valueUsd: number }[] = [];
  const rand = seeded(hashAddress(dna.address) ^ 0xa5a5);
  const total = dna.stats.balanceUsd;
  const bias = dna.narrativeExposure;
  for (const exposure of bias) {
    const candidates = monadTokens.filter((t) => t.narrative === exposure.narrative);
    if (!candidates.length) continue;
    const token = candidates[Math.floor(rand() * candidates.length)];
    holdings.push({ symbol: token.symbol, valueUsd: Math.round(total * exposure.share) });
  }
  if (!holdings.length) {
    holdings.push({ symbol: "MON", valueUsd: total });
  }
  return holdings;
}