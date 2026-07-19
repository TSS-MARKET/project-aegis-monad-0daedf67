import { useMonadWallet, short, isInIframe, topLevelUrl, eth } from "@/lib/monad-wallet";
import { Wallet, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function WalletConnectButton({ compact = false }: { compact?: boolean }) {
  const { address, onMonad, connecting, error, connect, disconnect } = useMonadWallet();
  const [open, setOpen] = useState(false);
  const [framed, setFramed] = useState(false);
  const [hasProvider, setHasProvider] = useState(true);
  useEffect(() => {
    setFramed(isInIframe());
    setHasProvider(!!eth());
  }, []);

  if (!address) {
    if (framed) {
      return (
        <a
          href={topLevelUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-2 rounded-[6px] cta-cyan overflow-hidden"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: compact ? "0.66rem" : "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            padding: compact ? "0.55rem 0.85rem" : "0.7rem 1rem",
          }}
          title="Wallets block dApps loaded in iframes. Opens Aegis in a new tab so your wallet can connect."
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)" }} />
          <Wallet className="w-3.5 h-3.5" />
          <span className="relative">Connect</span>
        </a>
      );
    }
    if (!hasProvider) {
      return (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-2 rounded-[6px] cta-cyan overflow-hidden"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: compact ? "0.66rem" : "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            padding: compact ? "0.55rem 0.85rem" : "0.7rem 1rem",
          }}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span className="relative">Install</span>
        </a>
      );
    }
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={connect}
          disabled={connecting}
          className="group relative inline-flex items-center gap-2 rounded-[6px] cta-cyan overflow-hidden disabled:opacity-70"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: compact ? "0.66rem" : "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            padding: compact ? "0.55rem 0.85rem" : "0.7rem 1rem",
          }}
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)" }} />
          {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
          <span className="relative">{connecting ? "Connecting" : "Connect"}</span>
        </button>
        {error && <span className="text-[10px] text-amber-300 max-w-[220px] text-right leading-tight">{error}</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between gap-2 rounded-[6px] px-3 py-2 transition-colors"
        style={{
          background: "rgba(34,211,238,0.05)",
          border: "1px solid rgba(34,211,238,0.2)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          letterSpacing: "0.06em",
        }}
      >
        <span className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: onMonad ? "#22d3ee" : "#f59e0b",
              boxShadow: onMonad ? "0 0 8px rgba(34,211,238,0.7)" : "0 0 8px rgba(245,158,11,0.7)",
            }}
          />
          <span style={{ color: "#f5f7fa" }}>{short(address)}</span>
        </span>
        {!onMonad && <AlertTriangle className="w-3 h-3 text-amber-400" />}
      </button>
      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 right-0 rounded-[6px] p-2 backdrop-blur-xl z-50 animate-fade-in"
          style={{
            background: "linear-gradient(180deg, rgba(10,18,28,0.95), rgba(4,10,16,0.95))",
            border: "1px solid rgba(34,211,238,0.2)",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
          }}
        >
          <div
            className="px-2 py-1.5"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.5)" }}
          >
            {onMonad ? "Monad · Connected" : "Wrong network"}
          </div>
          {!onMonad && (
            <button
              onClick={connect}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-amber-300"
            >
              Switch to Monad
            </button>
          )}
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-muted-foreground flex items-center gap-2"
          >
            <LogOut className="w-3 h-3" /> Disconnect
          </button>
        </div>
      )}
      {error && <div className="mt-1 text-[10px] text-destructive">{error}</div>}
    </div>
  );
}