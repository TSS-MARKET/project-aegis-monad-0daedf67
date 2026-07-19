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
import { Wallet, LogOut, AlertTriangle, Loader2, X, ExternalLink, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  const detected: { key: string; name: string; icon?: string; provider: WalletProvider["provider"] }[] = wallets.map((w) => ({
    key: w.rdns,
    name: w.name,
    icon: w.icon,
    provider: w.provider,
  }));
  if (!detected.length && injected) {
    detected.push({ key: "injected", name: "Browser Wallet", provider: injected });
  }
  const [expanded, setExpanded] = useState(true);

  // Lock body scroll while open
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("keydown", esc);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const CYAN = "#22d3ee";
  const modal = (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-150"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        aria-hidden
      />
      {/* Panel */}
      <div
        className="relative w-full max-w-[380px] sm:max-w-[420px] flex flex-col max-h-[85dvh] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col min-h-0"
          style={{
            background: "linear-gradient(180deg, oklch(0 0 0) 0%, rgba(4,10,16,0.98) 100%)",
            border: `1px solid ${CYAN}4d`,
            boxShadow: `0 0 0 1px ${CYAN}1a, 0 25px 50px -12px ${CYAN}40, 0 0 80px ${CYAN}26, inset 0 1px 0 ${CYAN}1a`,
          }}
        >
          {/* Radial glows */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full opacity-25" style={{ background: `radial-gradient(circle, ${CYAN} 0%, transparent 70%)` }} />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${CYAN} 0%, transparent 70%)` }} />
          </div>

          {/* Header */}
          <div className="relative p-4 sm:p-5 border-b flex-shrink-0" style={{ borderColor: `${CYAN}1f` }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="p-2.5 sm:p-3 rounded-xl flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${CYAN}33 0%, ${CYAN}14 100%)`,
                    border: `1px solid ${CYAN}33`,
                  }}
                >
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: CYAN }} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: "#f5f7fa" }}>
                    Connect Wallet
                  </h2>
                  <p className="text-xs sm:text-sm truncate" style={{ color: "rgba(245,247,250,0.55)" }}>
                    Choose your wallet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl border transition-all duration-150 flex-shrink-0 hover:scale-110 active:scale-95"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "rgba(245,247,250,0.6)" }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className="relative p-3 sm:p-4 overflow-y-auto flex-1 min-h-0"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            <div className="space-y-2.5 sm:space-y-3">
              <div className="px-1 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.5)" }}>
                Connect by Chain
              </div>

              {/* Monad chain row (accordion) */}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="w-full min-h-[56px] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 transition-all duration-200 group text-left border"
                style={{
                  background: expanded ? `${CYAN}14` : "rgba(255,255,255,0.03)",
                  borderColor: expanded ? `${CYAN}66` : "rgba(255,255,255,0.08)",
                }}
              >
                <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center p-[3px]" style={{ background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
                  <div className="w-full h-full rounded-[10px] flex items-center justify-center font-bold text-[11px]" style={{ background: `linear-gradient(135deg, ${CYAN} 0%, #0e2530 100%)`, color: "#020617" }}>
                    MON
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0 pointer-events-none">
                  <span className="font-semibold text-sm sm:text-base flex items-center gap-1.5" style={{ color: "#f5f7fa" }}>
                    {ACTIVE_MONAD.chainName}
                  </span>
                  <span className="text-xs sm:text-sm block truncate" style={{ color: "rgba(245,247,250,0.55)" }}>
                    MetaMask · Rabby · Trust · Coinbase · Phantom
                  </span>
                </div>
                <div className="flex-shrink-0 pointer-events-none">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border" style={{ background: expanded ? `${CYAN}33` : "rgba(255,255,255,0.05)", borderColor: expanded ? `${CYAN}66` : "rgba(255,255,255,0.08)" }}>
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : "none", color: expanded ? CYAN : "rgba(245,247,250,0.6)" }} />
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="space-y-1.5 pl-1">
                  {detected.length > 0 && (
                    <>
                      <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.45)" }}>
                        Detected
                      </div>
                      {detected.map((w) => (
                        <button
                          key={w.key}
                          onClick={() => onPick(w.provider)}
                          className="w-full min-h-[56px] flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border transition-all group hover:scale-[1.01] active:scale-[0.99]"
                          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${CYAN}0d`; e.currentTarget.style.borderColor = `${CYAN}55`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                        >
                          <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center p-[3px]" style={{ background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
                            {w.icon ? (
                              <img src={w.icon} alt="" className="w-full h-full object-contain rounded-[10px]" draggable={false} />
                            ) : (
                              <div className="w-full h-full rounded-[10px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${CYAN}33 0%, ${CYAN}0d 100%)` }}>
                                <Wallet className="w-4 h-4" style={{ color: CYAN }} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-semibold truncate" style={{ color: "#f5f7fa" }}>{w.name}</div>
                            <div className="text-[11px]" style={{ color: `${CYAN}` }}>Installed</div>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.14em] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: CYAN }}>Connect</span>
                        </button>
                      ))}
                    </>
                  )}

                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(245,247,250,0.45)" }}>
                    {mobile ? "Open in wallet app" : "Or connect via mobile wallet"}
                  </div>
                  {deepLinks.map((d) => (
                    <a
                      key={d.name}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[56px] flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border transition-all group"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${CYAN}0d`; e.currentTarget.style.borderColor = `${CYAN}55`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                    >
                      <div className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
                        <span>{d.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold truncate" style={{ color: "#f5f7fa" }}>{d.name}</div>
                        <div className="text-[11px]" style={{ color: "rgba(245,247,250,0.5)" }}>Deep link</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5" style={{ color: "rgba(245,247,250,0.4)" }} />
                    </a>
                  ))}

                  <div className="mt-3 px-1 text-[10px] leading-relaxed" style={{ color: "rgba(245,247,250,0.4)", fontFamily: "var(--font-mono)" }}>
                    Aegis will request access, then switch your wallet to <span style={{ color: CYAN }}>{ACTIVE_MONAD.chainName}</span> ({ACTIVE_MONAD.chainIdDec}). No signature or funds required.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}