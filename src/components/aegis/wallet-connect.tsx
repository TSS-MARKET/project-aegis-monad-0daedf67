import {
  useMonadWallet,
  short,
  isInIframe,
  topLevelUrl,
  eth,
  ACTIVE_MONAD,
  listWallets,
  subscribeWallets,
  walletDeepLinks,
  isMobile,
  type WalletProvider,
} from "@/lib/monad-wallet";
import { Wallet, LogOut, AlertTriangle, Loader2, X, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export function WalletConnectButton({ compact = false }: { compact?: boolean }) {
  const { address, onMonad, connecting, error, connect, disconnect } = useMonadWallet();
  const [open, setOpen] = useState(false);
  const [framed, setFramed] = useState(false);
  const [wallets, setWallets] = useState<WalletProvider[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setFramed(isInIframe());
    setMobile(isMobile());
    const sync = () => setWallets(listWallets());
    sync();
    return subscribeWallets(sync);
  }, []);
  const deepLinks = walletDeepLinks();
  const injected = eth();
  const btnStyle = {
    fontFamily: "var(--font-display)",
    fontSize: compact ? "0.66rem" : "0.72rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.16em",
    padding: compact ? "0.55rem 0.85rem" : "0.7rem 1rem",
  };

  if (!address) {
    if (framed) {
      return (
        <a
          href={topLevelUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-2 rounded-[6px] cta-cyan overflow-hidden"
          style={btnStyle}
          title="Wallets block dApps loaded in iframes. Opens Aegis in a new tab so your wallet can connect."
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)" }} />
          <Wallet className="w-3.5 h-3.5" />
          <span className="relative">Connect</span>
        </a>
      );
    }
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => setPickerOpen(true)}
          disabled={connecting}
          className="group relative inline-flex items-center gap-2 rounded-[6px] cta-cyan overflow-hidden disabled:opacity-70"
          style={btnStyle}
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)" }} />
          {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
          <span className="relative">{connecting ? "Connecting" : "Connect"}</span>
        </button>
        {error && <span className="text-[10px] text-amber-300 max-w-[220px] text-right leading-tight">{error}</span>}
        {pickerOpen && (
          <WalletPicker
            wallets={wallets}
            injected={injected}
            mobile={mobile}
            deepLinks={deepLinks}
            onClose={() => setPickerOpen(false)}
            onPick={async (p) => {
              setPickerOpen(false);
              await connect(p);
            }}
          />
        )}
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
            {onMonad ? `${ACTIVE_MONAD.chainName} · Connected` : "Wrong network"}
          </div>
          {!onMonad && (
            <button
            onClick={() => connect()}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-amber-300"
            >
              Switch to {ACTIVE_MONAD.chainName}
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

function WalletPicker({
  wallets,
  injected,
  mobile,
  deepLinks,
  onClose,
  onPick,
}: {
  wallets: WalletProvider[];
  injected: ReturnType<typeof eth>;
  mobile: boolean;
  deepLinks: { name: string; url: string; icon: string }[];
  onClose: () => void;
  onPick: (p?: WalletProvider["provider"]) => void;
}) {
  // Merge EIP-6963 wallets with a fallback for injected-only providers
  const detected: { key: string; name: string; icon?: string; provider: WalletProvider["provider"] }[] = wallets.map((w) => ({
    key: w.rdns,
    name: w.name,
    icon: w.icon,
    provider: w.provider,
  }));
  if (!detected.length && injected) {
    detected.push({ key: "injected", name: "Browser Wallet", provider: injected });
  }
  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] rounded-xl p-5 animate-fade-in"
        style={{
          background: "linear-gradient(180deg, rgba(10,18,28,0.98), rgba(4,10,16,0.98))",
          border: "1px solid rgba(34,211,238,0.25)",
          boxShadow: "0 40px 120px -20px rgba(0,0,0,0.9), 0 0 40px -10px rgba(34,211,238,0.2)",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#22d3ee" }}>
              Aegis · Monad
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "#f5f7fa", marginTop: 4 }}>
              Connect a wallet
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-white/60"><X className="w-4 h-4" /></button>
        </div>

        {detected.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40 mb-2" style={{ fontFamily: "var(--font-mono)" }}>Detected</div>
            <div className="space-y-1.5 mb-4">
              {detected.map((w) => (
                <button
                  key={w.key}
                  onClick={() => onPick(w.provider)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-all hover:bg-cyan-500/5 hover:border-cyan-500/40 group"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {w.icon ? (
                    <img src={w.icon} alt="" className="w-8 h-8 rounded-md" />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center"><Wallet className="w-4 h-4 text-cyan-400" /></div>
                  )}
                  <span className="flex-1 text-left text-sm text-white/90 font-medium">{w.name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">Connect</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="text-[10px] uppercase tracking-[0.16em] text-white/40 mb-2" style={{ fontFamily: "var(--font-mono)" }}>
          {mobile ? "Open in wallet app" : "Or connect via mobile wallet"}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {deepLinks.map((d) => (
            <a
              key={d.name}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-cyan-500/5 group"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-lg leading-none">{d.icon}</span>
              <span className="flex-1 text-xs text-white/80">{d.name}</span>
              <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-cyan-400" />
            </a>
          ))}
        </div>

        <div className="mt-4 text-[10px] text-white/40 leading-relaxed" style={{ fontFamily: "var(--font-mono)" }}>
          Aegis will request access, then switch your wallet to <span className="text-cyan-400">{ACTIVE_MONAD.chainName}</span> ({ACTIVE_MONAD.chainIdDec}). No signature or funds required.
        </div>
      </div>
    </>
  );
}