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
import { Wallet, LogOut, AlertTriangle, Loader2, X, ExternalLink, Check, ChevronRight, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const CYAN = "#22d3ee";

// Local (WalletConnect explorer / official) wallet brand marks copied into
// public/wallet-logos/ from the Glavior asset set.
const WALLET_LOGOS: Record<string, string> = {
  MetaMask: "/wallet-logos/metamask.webp",
  "Trust Wallet": "/wallet-logos/trust.webp",
  Trust: "/wallet-logos/trust.webp",
  Phantom: "/wallet-logos/phantom.webp",
  "Coinbase Wallet": "/wallet-logos/coinbase.svg",
  Coinbase: "/wallet-logos/coinbase.svg",
  "OKX Wallet": "/wallet-logos/okx.webp",
  OKX: "/wallet-logos/okx.webp",
  "Bitget Wallet": "/wallet-logos/bitget.webp",
  Bitget: "/wallet-logos/bitget.webp",
  "Brave Wallet": "/wallet-logos/brave.webp",
  Brave: "/wallet-logos/brave.webp",
  Backpack: "/wallet-logos/backpack.webp",
  Exodus: "/wallet-logos/exodus.webp",
  Ledger: "/wallet-logos/ledger.svg",
  Solflare: "/wallet-logos/solflare.webp",
  Nightly: "/wallet-logos/nightly.webp",
  Rabby: "/wallet-logos/rabby.png",
};

const WALLET_INSTALL: Record<string, string> = {
  MetaMask: "https://metamask.io/download/",
  "Trust Wallet": "https://trustwallet.com/download",
  Phantom: "https://phantom.app/download",
  "Coinbase Wallet": "https://www.coinbase.com/wallet/downloads",
  "OKX Wallet": "https://www.okx.com/web3",
  "Bitget Wallet": "https://web3.bitget.com/en/wallet-download",
  Rabby: "https://rabby.io/",
  "Brave Wallet": "https://brave.com/wallet/",
  Backpack: "https://backpack.app/downloads",
  Exodus: "https://www.exodus.com/download/",
};

function logoFor(name: string, adapterIcon?: string) {
  if (adapterIcon) return adapterIcon;
  return WALLET_LOGOS[name] || null;
}

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

// ────────────────────────────────────────────────────────────────────────────
// Wallet logo tile
// ────────────────────────────────────────────────────────────────────────────

function WalletLogo({ name, icon }: { name: string; icon?: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : logoFor(name, icon || undefined);
  const initial = name.charAt(0).toUpperCase();
  if (!src) {
    return (
      <div
        className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-sm"
        style={{ background: "linear-gradient(135deg,#333 0%,#000 100%)" }}
      >
        {initial}
      </div>
    );
  }
  return (
    <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center bg-white/[0.04] ring-1 ring-white/[0.06] p-[3px]">
      <img
        src={src}
        alt={`${name} logo`}
        className="w-full h-full object-contain rounded-[10px]"
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Picker panel (Glavior visual replica, single chain = Monad)
// ────────────────────────────────────────────────────────────────────────────

type Row = {
  key: string;
  name: string;
  icon?: string | null;
  mode: "installed" | "deeplink" | "install";
  detected: boolean;
  onClick: () => void;
};

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
  // Body scroll lock + esc
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

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const seen = new Set<string>();
    // 1) Detected via EIP-6963
    for (const w of wallets) {
      seen.add(w.name.toLowerCase());
      out.push({
        key: w.rdns,
        name: w.name,
        icon: w.icon,
        mode: "installed",
        detected: true,
        onClick: () => onPick(w.provider),
      });
    }
    // 2) Fallback injected (window.ethereum) if nothing announced
    if (!wallets.length && injected) {
      seen.add("browser wallet");
      out.push({
        key: "injected",
        name: "Browser Wallet",
        mode: "installed",
        detected: true,
        onClick: () => onPick(injected),
      });
    }
    // 3) Popular catalog
    const catalog = ["MetaMask", "Trust Wallet", "Phantom", "Coinbase Wallet", "OKX Wallet", "Rabby", "Bitget Wallet", "Brave Wallet"];
    for (const name of catalog) {
      if (seen.has(name.toLowerCase())) continue;
      if (mobile) {
        const dl = deepLinks.find((d) => d.name === name);
        if (dl) {
          out.push({
            key: `dl-${name}`,
            name,
            mode: "deeplink",
            detected: false,
            onClick: () => { window.location.href = dl.url; },
          });
          continue;
        }
      }
      const install = WALLET_INSTALL[name];
      if (install) {
        out.push({
          key: `in-${name}`,
          name,
          mode: "install",
          detected: false,
          onClick: () => window.open(install, "_blank", "noopener"),
        });
      }
    }
    // installed first, then deeplink, then install
    const order = { installed: 0, deeplink: 1, install: 2 } as const;
    out.sort((a, b) => order[a.mode] - order[b.mode]);
    return out;
  }, [wallets, injected, mobile, deepLinks, onPick]);

  if (typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-150"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        aria-hidden
      />
      <div
        className="relative w-full max-w-[440px] sm:max-w-[500px] flex flex-col max-h-[88dvh] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
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

          {/* Header — Monad chain identity */}
          <div className="relative p-5 sm:p-6 border-b flex-shrink-0" style={{ borderColor: `${CYAN}1f` }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/[0.04] ring-1 ring-white/[0.06] p-[3px]">
                  <img src="/wallet-logos/monad.png" alt="Monad" className="w-full h-full object-contain rounded-[10px]" draggable={false} />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-lg sm:text-xl font-bold uppercase"
                    style={{ color: "#f5f7fa", fontFamily: "var(--font-display)", letterSpacing: "0.14em" }}
                  >
                    Connect Wallet
                  </h2>
                  <p
                    className="text-[10px] sm:text-[11px] truncate uppercase mt-0.5"
                    style={{ color: "rgba(245,247,250,0.55)", fontFamily: "var(--font-display)", letterSpacing: "0.22em" }}
                  >
                    {ACTIVE_MONAD.chainName} · Chain {ACTIVE_MONAD.chainIdDec}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl border transition-all duration-150 flex-shrink-0 hover:scale-110 active:scale-95"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
                aria-label="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "rgba(245,247,250,0.6)" }} />
              </button>
            </div>
          </div>

          {/* Wallet rows */}
          <div
            className="relative p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 space-y-2"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {rows.map((r) => {
              const isPremium = r.mode === "installed" || (r.mode === "deeplink" && r.detected);
              const container = isPremium
                ? "bg-gradient-to-r from-[#22d3ee]/10 to-[#22d3ee]/5 hover:from-[#22d3ee]/15 hover:to-[#22d3ee]/10 border border-[#22d3ee]/30 hover:border-[#22d3ee]/50"
                : "bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20";
              let status: string;
              let statusCls: string;
              if (r.mode === "installed") { status = "✓ Ready to connect"; statusCls = "text-emerald-400 font-medium"; }
              else if (r.mode === "deeplink") { status = "Open in app"; statusCls = "text-cyan-400 font-medium"; }
              else { status = `Get ${r.name}`; statusCls = "text-white/50"; }
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={r.onClick}
                  className={`w-full min-h-[72px] p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 transition-colors duration-150 group text-left ${container}`}
                >
                  <div className="relative flex-shrink-0 transform group-hover:scale-105 transition-transform duration-200 pointer-events-none">
                    <WalletLogo name={r.name} icon={r.icon} />
                    {r.detected && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center shadow-lg">
                        <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0 pointer-events-none">
                    <span
                      className="font-semibold text-sm sm:text-base block truncate uppercase"
                      style={{ color: "#f5f7fa", fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}
                    >
                      {r.name}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] block truncate uppercase mt-0.5 ${statusCls}`}
                      style={{ fontFamily: "var(--font-display)", letterSpacing: "0.18em" }}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex-shrink-0 pointer-events-none">
                    {isPremium ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 flex items-center justify-center shadow-[0_0_12px_-2px_rgba(34,211,238,0.35)] group-hover:bg-[#22d3ee]/25 group-hover:border-[#22d3ee]/50 group-hover:shadow-[0_0_18px_-2px_rgba(34,211,238,0.55)] transition-all duration-300">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#22d3ee] group-hover:translate-x-0.5 transition-transform duration-300" />
                      </div>
                    ) : r.mode === "deeplink" ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                        <ExternalLink className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                        <Download className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            <div className="mt-3 px-1 text-[10px] leading-relaxed" style={{ color: "rgba(245,247,250,0.4)", fontFamily: "var(--font-mono)" }}>
              Aegis will request access, then switch your wallet to <span style={{ color: CYAN }}>{ACTIVE_MONAD.chainName}</span> ({ACTIVE_MONAD.chainIdDec}). No signature or funds required.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}