// Client-side Monad wallet connection via EIP-1193 (MetaMask etc.)
// Supports Monad Mainnet (143) and Monad Testnet (10143).
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

  useEffect(() => {
    const e = eth();
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
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (isInIframe()) {
      setError("Wallets block dApps inside iframes. Open Aegis in a new tab first.");
      return;
    }
    const e = eth();
    if (!e) {
      setError("No wallet detected. Install MetaMask, Rabby or another EIP-1193 wallet.");
      return;
    }
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
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem("aegis_wallet");
  }, []);

  const onMonad = chainId?.toLowerCase() === ACTIVE_MONAD.chainIdHex.toLowerCase();
  return { address, chainId, onMonad, connecting, error, connect, disconnect };
}