import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseAbi,
  parseEther,
  keccak256,
  toBytes,
  type Address,
  type Hex,
} from "viem";
import { ACTIVE_MONAD, MONAD_MAINNET, MONAD_TESTNET, eth } from "./monad-wallet";

export const AEGIS_ABI = parseAbi([
  "function owner() view returns (address)",
  "function publisher() view returns (address)",
  "function monthlyPriceWei() view returns (uint256)",
  "function totalBriefs() view returns (uint256)",
  "function isPro(address) view returns (bool)",
  "function subs(address) view returns (uint64 expiresAt, uint64 tier)",
  "function getWatchlist(address) view returns (bytes32[])",
  "function snapshotCount(address) view returns (uint256)",
  "function verifyBrief(bytes32) view returns (bool exists, uint64 timestamp)",
  "function subscribe(uint64 months) payable",
  "function setWatchlist(bytes32[] symbols)",
  "function snapshotPortfolio(bytes32 portfolioHash, string uri)",
  "function publishBrief(bytes32 briefHash, string uri)",
  "event Subscribed(address indexed user, uint64 tier, uint64 expiresAt, uint256 pricePaid)",
  "event WatchlistUpdated(address indexed user, bytes32[] symbols)",
  "event PortfolioSnapshot(address indexed user, uint256 index, bytes32 portfolioHash, string uri)",
  "event BriefPublished(uint256 indexed index, bytes32 indexed briefHash, string uri)",
]);

export const AEGIS_CONTRACT_ADDRESS = (import.meta.env.VITE_AEGIS_CONTRACT_ADDRESS ?? "") as Address;
export const IS_CONFIGURED = /^0x[0-9a-fA-F]{40}$/.test(AEGIS_CONTRACT_ADDRESS);

const viemChain = {
  id: ACTIVE_MONAD.chainIdDec,
  name: ACTIVE_MONAD.chainName,
  nativeCurrency: ACTIVE_MONAD.nativeCurrency,
  rpcUrls: { default: { http: ACTIVE_MONAD.rpcUrls }, public: { http: ACTIVE_MONAD.rpcUrls } },
  blockExplorers: { default: { name: "Explorer", url: ACTIVE_MONAD.blockExplorerUrls[0] } },
} as const;

export function publicClient() {
  return createPublicClient({ chain: viemChain, transport: http(ACTIVE_MONAD.rpcUrls[0]) });
}

export function walletClient() {
  const e = eth();
  if (!e) throw new Error("No wallet detected");
  return createWalletClient({ chain: viemChain, transport: custom(e as never) });
}

export function explorerTx(hash: string) {
  return `${ACTIVE_MONAD.blockExplorerUrls[0]}/tx/${hash}`;
}

export function explorerAddress(addr: string) {
  return `${ACTIVE_MONAD.blockExplorerUrls[0]}/address/${addr}`;
}

/** Convert a short ticker (max 32 chars) to a bytes32 tag. */
export function tickerToBytes32(sym: string): Hex {
  const clean = sym.trim().toUpperCase().slice(0, 31);
  const bytes = new Uint8Array(32);
  const src = new TextEncoder().encode(clean);
  bytes.set(src.slice(0, 32));
  return ("0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")) as Hex;
}

export function bytes32ToTicker(hex: Hex): string {
  const raw = hex.slice(2);
  const buf = new Uint8Array(raw.length / 2);
  for (let i = 0; i < buf.length; i++) buf[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
  // trim trailing zeros
  let end = buf.length;
  while (end > 0 && buf[end - 1] === 0) end--;
  return new TextDecoder().decode(buf.slice(0, end));
}

export function hashPortfolio(input: string): Hex {
  return keccak256(toBytes(input));
}

export function monToWei(mon: string): bigint {
  return parseEther(mon || "0");
}

export const CHAIN_LABEL = ACTIVE_MONAD === MONAD_MAINNET ? "Mainnet" : "Testnet";
export const CHAINS = { MAINNET: MONAD_MAINNET, TESTNET: MONAD_TESTNET };