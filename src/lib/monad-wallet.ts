// Client-side Monad wallet connection via EIP-1193 (MetaMask etc.)
// Monad Testnet reference: chainId 10143, RPC https://testnet-rpc.monad.xyz
import { useCallback, useEffect, useState } from "react";

export const MONAD_TESTNET = {
  chainIdHex: "0x279F", // 10143
  chainIdDec: 10143,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
};

type Eth = {
  request: (a: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

function eth(): Eth | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { ethereum?: Eth };
  return w.ethereum ?? null;
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
    const onAcc = (accs: unknown[]) => {
      const list = accs as string[];
      setAddress(list?.[0] ?? null);
      if (!list?.[0]) localStorage.removeItem("aegis_wallet");
    };
    const onChain = (c: unknown) => setChainId(c as string);
    e.on?.("accountsChanged", onAcc);
    e.on?.("chainChanged", onChain);
    return () => {
      e.removeListener?.("accountsChanged", onAcc);
      e.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    const e = eth();
    if (!e) {
      setError("No wallet detected. Install MetaMask to connect.");
      return;
    }
    try {
      setConnecting(true);
      const accs = (await e.request({ method: "eth_requestAccounts" })) as string[];
      if (!accs?.[0]) throw new Error("No account granted");
      setAddress(accs[0]);
      localStorage.setItem("aegis_wallet", accs[0]);
      // Try to switch to Monad Testnet; if unknown, add it.
      try {
        await e.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MONAD_TESTNET.chainIdHex }],
        });
      } catch (err) {
        const code = (err as { code?: number })?.code;
        if (code === 4902 || code === -32603) {
          await e.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: MONAD_TESTNET.chainIdHex,
                chainName: MONAD_TESTNET.chainName,
                nativeCurrency: MONAD_TESTNET.nativeCurrency,
                rpcUrls: MONAD_TESTNET.rpcUrls,
                blockExplorerUrls: MONAD_TESTNET.blockExplorerUrls,
              },
            ],
          });
        }
      }
      const c = (await e.request({ method: "eth_chainId" })) as string;
      setChainId(c);
    } catch (err) {
      setError((err as Error).message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem("aegis_wallet");
  }, []);

  const onMonad = chainId?.toLowerCase() === MONAD_TESTNET.chainIdHex.toLowerCase();
  return { address, chainId, onMonad, connecting, error, connect, disconnect };
}