// Client-side Monad wallet connection via EIP-1193 (MetaMask etc.)
// Supports Monad Mainnet (143) and Monad Testnet (10143).
// Discovers providers via EIP-6963 (MetaMask, Rabby, Trust, Phantom EVM,
// Coinbase, OKX, …) and falls back to window.ethereum. On mobile without a
// provider, exposes deep links so users can open Aegis inside the wallet's
// in-app browser instead of seeing an "install" wall.
import { useCallback, useEffect, useState } from "react";

export const MONAD_MAINNET = {
  chainIdHex: "0x8f", // 143
  chainIdDec: 143,
  chainName: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://rpc.monad.xyz"],
  blockExplorerUrls: ["https://monadexplorer.com"],
};

export const MONAD_TESTNET = {
  chainIdHex: "0x279F", // 10143
  chainIdDec: 10143,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
};

const CHAIN_ENV = (import.meta.env.VITE_AEGIS_CHAIN as string | undefined)?.toLowerCase();
export const ACTIVE_MONAD = CHAIN_ENV === "testnet" ? MONAD_TESTNET : MONAD_MAINNET;

type Eth = {
  request: (a: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

export function eth(): Eth | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { ethereum?: Eth };
  return w.ethereum ?? null;
}

// ---------------------------------------------------------------------------
// EIP-6963 multi-provider discovery
// ---------------------------------------------------------------------------

export type WalletProvider = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
  provider: Eth;
};

type Eip6963Detail = {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eth;
};

const discovered = new Map<string, WalletProvider>();
const listeners = new Set<() => void>();

function pushProvider(detail: Eip6963Detail) {
  discovered.set(detail.info.rdns, {
    uuid: detail.info.uuid,
    name: detail.info.name,
    icon: detail.info.icon,
    rdns: detail.info.rdns,
    provider: detail.provider,
  });
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event) => {
    const detail = (event as CustomEvent<Eip6963Detail>).detail;
    if (detail?.info && detail?.provider) pushProvider(detail);
  });
  // Request providers to announce themselves now and whenever they load.
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function listWallets(): WalletProvider[] {
  return Array.from(discovered.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function subscribeWallets(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("eip6963:requestProvider"));
  return () => listeners.delete(cb);
}

export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

// Deep links open Aegis inside the wallet's in-app browser, where a provider
// is injected and connection Just Works — no install step.
export function walletDeepLinks(): { name: string; url: string; icon: string }[] {
  if (typeof window === "undefined") return [];
  const host = window.location.host;
  const full = window.location.href.replace(/^https?:\/\//, "");
  return [
    { name: "MetaMask", icon: "🦊", url: `https://metamask.app.link/dapp/${host}` },
    { name: "Trust Wallet", icon: "🛡️", url: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}` },
    { name: "Phantom", icon: "👻", url: `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(host)}` },
    { name: "Coinbase Wallet", icon: "🔵", url: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}` },
    { name: "Rainbow", icon: "🌈", url: `https://rnbwapp.com/dapp/${full}` },
    { name: "OKX Wallet", icon: "⭕", url: `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(window.location.href)}` },
  ];
}

export function isInIframe(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.self !== window.top; } catch { return true; }
}

export function topLevelUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export function short(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export function useMonadWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<Eth | null>(null);

  useEffect(() => {
    const e = activeProvider ?? eth();
    if (!e) return;
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("aegis_wallet") : null;
    if (saved) {
      e.request({ method: "eth_accounts" })
        .then((accs) => {
          const list = accs as string[];
          if (list?.[0]) setAddress(list[0]);
        })
        .catch(() => {});
      e.request({ method: "eth_chainId" })
        .then((c) => setChainId(c as string))
        .catch(() => {});
    }
    const onAcc = (...args: unknown[]) => {
      const list = (args[0] as string[]) ?? [];
      setAddress(list[0] ?? null);
      if (!list[0]) localStorage.removeItem("aegis_wallet");
    };
    const onChain = (...args: unknown[]) => setChainId(args[0] as string);
    e.on?.("accountsChanged", onAcc);
    e.on?.("chainChanged", onChain);
    return () => {
      e.removeListener?.("accountsChanged", onAcc);
      e.removeListener?.("chainChanged", onChain);
    };
  }, [activeProvider]);

  const connect = useCallback(async (provider?: Eth) => {
    setError(null);
    if (isInIframe()) {
      setError("Wallets block dApps inside iframes. Open Aegis in a new tab first.");
      return;
    }
    const e = provider ?? activeProvider ?? eth();
    if (!e) {
      setError("No wallet detected. Choose a wallet above to open Aegis inside it.");
      return;
    }
    if (provider) setActiveProvider(provider);
    try {
      setConnecting(true);
      const accs = (await e.request({ method: "eth_requestAccounts" })) as string[];
      if (!accs?.[0]) throw new Error("No account granted");
      setAddress(accs[0]);
      localStorage.setItem("aegis_wallet", accs[0]);
      // Try to switch to the active Monad chain; if unknown, add it.
      try {
        await e.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ACTIVE_MONAD.chainIdHex }],
        });
      } catch (err) {
        const code = (err as { code?: number })?.code;
        const msg = ((err as { message?: string })?.message || "").toLowerCase();
        const unknownChain = code === 4902 || code === -32603 || msg.includes("unrecognized") || msg.includes("unknown");
        if (unknownChain) {
          await e.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ACTIVE_MONAD.chainIdHex,
                chainName: ACTIVE_MONAD.chainName,
                nativeCurrency: ACTIVE_MONAD.nativeCurrency,
                rpcUrls: ACTIVE_MONAD.rpcUrls,
                blockExplorerUrls: ACTIVE_MONAD.blockExplorerUrls,
              },
            ],
          });
        } else if (code === 4001) {
          throw new Error("You rejected the network switch. Approve Monad in your wallet.");
        } else {
          throw err;
        }
      }
      const c = (await e.request({ method: "eth_chainId" })) as string;
      setChainId(c);
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 4001) setError("Connection rejected in wallet.");
      else setError((err as Error).message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  }, [activeProvider]);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem("aegis_wallet");
  }, []);

  const onMonad = chainId?.toLowerCase() === ACTIVE_MONAD.chainIdHex.toLowerCase();
  return { address, chainId, onMonad, connecting, error, connect, disconnect };
}