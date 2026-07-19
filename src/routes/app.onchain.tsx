import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Check, Coins, FileSignature, Loader2, ShieldCheck, Wallet, X } from "lucide-react";
import {
  AEGIS_ABI,
  AEGIS_CONTRACT_ADDRESS,
  CHAIN_LABEL,
  IS_CONFIGURED,
  bytes32ToTicker,
  explorerAddress,
  explorerTx,
  hashPortfolio,
  publicClient,
  tickerToBytes32,
  walletClient,
} from "@/lib/aegis-contract";
import { formatEther } from "viem";
import { useMonadWallet } from "@/lib/monad-wallet";

export const Route = createFileRoute("/app/onchain")({ component: OnChainPage });

const MONO = "var(--font-mono)";
const SERIF = "var(--font-serif)";

function OnChainPage() {
  const { address, onMonad, connect, connecting } = useMonadWallet();
  const [priceWei, setPriceWei] = useState<bigint | null>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [expiresAt, setExpiresAt] = useState<bigint>(0n);
  const [totalBriefs, setTotalBriefs] = useState<bigint>(0n);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [snapshotCount, setSnapshotCount] = useState<bigint>(0n);
  const [months, setMonths] = useState(1);
  const [tickerInput, setTickerInput] = useState("");
  const [portfolioNote, setPortfolioNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!IS_CONFIGURED) return;
    try {
      const c = publicClient();
      const [p, tb] = await Promise.all([
        c.readContract({ address: AEGIS_CONTRACT_ADDRESS, abi: AEGIS_ABI, functionName: "monthlyPriceWei" }),
        c.readContract({ address: AEGIS_CONTRACT_ADDRESS, abi: AEGIS_ABI, functionName: "totalBriefs" }),
      ]);
      setPriceWei(p as bigint);
      setTotalBriefs(tb as bigint);
      if (address) {
        const [pro, sub, wl, sc] = await Promise.all([
          c.readContract({ address: AEGIS_CONTRACT_ADDRESS, abi: AEGIS_ABI, functionName: "isPro", args: [address as `0x${string}`] }),
          c.readContract({ address: AEGIS_CONTRACT_ADDRESS, abi: AEGIS_ABI, functionName: "subs", args: [address as `0x${string}`] }),
          c.readContract({ address: AEGIS_CONTRACT_ADDRESS, abi: AEGIS_ABI, functionName: "getWatchlist", args: [address as `0x${string}`] }),
          c.readContract({ address: AEGIS_CONTRACT_ADDRESS, abi: AEGIS_ABI, functionName: "snapshotCount", args: [address as `0x${string}`] }),
        ]);
        setIsPro(pro as boolean);
        setExpiresAt((sub as readonly [bigint, bigint])[0]);
        setWatchlist((wl as `0x${string}`[]).map(bytes32ToTicker).filter(Boolean));
        setSnapshotCount(sc as bigint);
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  async function withTx(label: string, fn: () => Promise<`0x${string}`>) {
    setBusy(label); setErr(null); setTxHash(null);
    try {
      const hash = await fn();
      setTxHash(hash);
      await publicClient().waitForTransactionReceipt({ hash });
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function doSubscribe() {
    if (!address || priceWei == null) return;
    const wc = walletClient();
    await withTx("subscribe", () =>
      wc.writeContract({
        account: address as `0x${string}`,

        address: AEGIS_CONTRACT_ADDRESS,
        abi: AEGIS_ABI,
        functionName: "subscribe",
        args: [BigInt(months)],
        value: priceWei * BigInt(months),
      }),
    );
  }

  async function addTicker() {
    if (!address || !tickerInput.trim()) return;
    const next = Array.from(new Set([...watchlist, tickerInput.trim().toUpperCase()])).slice(0, 32);
    setTickerInput("");
    const wc = walletClient();
    await withTx("watchlist", () =>
      wc.writeContract({
        account: address as `0x${string}`,

        address: AEGIS_CONTRACT_ADDRESS,
        abi: AEGIS_ABI,
        functionName: "setWatchlist",
        args: [next.map(tickerToBytes32)],
      }),
    );
  }

  async function removeTicker(sym: string) {
    if (!address) return;
    const next = watchlist.filter((s) => s !== sym);
    const wc = walletClient();
    await withTx("watchlist", () =>
      wc.writeContract({
        account: address as `0x${string}`,

        address: AEGIS_CONTRACT_ADDRESS,
        abi: AEGIS_ABI,
        functionName: "setWatchlist",
        args: [next.map(tickerToBytes32)],
      }),
    );
  }

  async function commitSnapshot() {
    if (!address) return;
    const payload = JSON.stringify({ user: address, note: portfolioNote, at: Date.now() });
    const h = hashPortfolio(payload);
    const wc = walletClient();
    await withTx("snapshot", () =>
      wc.writeContract({
        account: address as `0x${string}`,

        address: AEGIS_CONTRACT_ADDRESS,
        abi: AEGIS_ABI,
        functionName: "snapshotPortfolio",
        args: [h, portfolioNote || ""],
      }),
    );
    setPortfolioNote("");
  }

  return (
    <div className="min-h-screen px-4 md:px-10 pt-4 md:pt-6 pb-8 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>
            AEGIS · ON-CHAIN LAYER · MONAD {CHAIN_LABEL.toUpperCase()}
          </div>
          <h1 className="mt-2" style={{ fontFamily: SERIF, fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#f5f7fa", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Every write is a real <em style={{ color: "#22d3ee" }}>Monad transaction</em>.
          </h1>
          <p className="mt-2 text-sm max-w-2xl" style={{ color: "rgba(245,247,250,0.7)" }}>
            Subscriptions, watchlists, portfolio commitments and AI brief attestations live in the AegisRegistry contract.
            No mocks — sign the tx, watch it land on Monad, verify on the explorer.
          </p>
        </div>
        <div className="text-right shrink-0">
          {IS_CONFIGURED ? (
            <a
              href={explorerAddress(AEGIS_CONTRACT_ADDRESS)}
              target="_blank" rel="noreferrer"
              className="group inline-flex items-center gap-2 px-3 py-2 rounded-[6px]"
              style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.28)", fontFamily: MONO, fontSize: "0.72rem", color: "#f5f7fa" }}
            >
              <span style={{ color: "rgba(34,211,238,0.75)", letterSpacing: "0.12em" }}>CONTRACT</span>
              <span className="tabular-nums">{AEGIS_CONTRACT_ADDRESS.slice(0, 6)}…{AEGIS_CONTRACT_ADDRESS.slice(-4)}</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-[6px]" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.3)", fontFamily: MONO, fontSize: "0.7rem", color: "#fb7185" }}>
              Contract not configured · set VITE_AEGIS_CONTRACT_ADDRESS
            </span>
          )}
        </div>
      </header>

      {!address && (
        <div className="mb-6 rounded-[10px] p-5 flex flex-wrap items-center justify-between gap-4"
          style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.7), rgba(4,10,16,0.7))", border: "1px solid rgba(34,211,238,0.2)" }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: "1.15rem", color: "#f5f7fa" }}>Connect your Monad wallet</div>
            <div className="text-sm mt-1" style={{ color: "rgba(245,247,250,0.65)" }}>Aegis is non-custodial. Read-only until you sign a transaction.</div>
          </div>
          <button
            onClick={() => connect()}
            disabled={connecting}
            className="cta-cyan rounded-[6px] px-4 py-2.5"
            style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            {connecting ? "Connecting…" : "Connect"}
          </button>
        </div>
      )}

      {address && !onMonad && (
        <div className="mb-6 rounded-[10px] p-4 text-sm" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.28)", color: "#fbbf24" }}>
          Wrong network. Switch to Monad {CHAIN_LABEL} to sign transactions.
        </div>
      )}

      {err && (
        <div className="mb-6 rounded-[10px] p-3 text-xs" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.3)", color: "#fb7185" }}>
          {err}
        </div>
      )}
      {txHash && (
        <div className="mb-6 rounded-[10px] p-3 text-xs flex items-center justify-between gap-2" style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
          <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Broadcasted to Monad</span>
          <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1 tabular-nums">
            {txHash.slice(0, 10)}… <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Subscription */}
        <Panel icon={<ShieldCheck className="h-4 w-4" style={{ color: "#22d3ee" }} />} title="Pro Subscription">
          <Stat label="Price" value={priceWei != null ? `${formatEther(priceWei)} MON / month` : "—"} />
          <Stat label="Your status" value={
            isPro == null ? "—" : isPro
              ? `Pro · until ${new Date(Number(expiresAt) * 1000).toLocaleDateString()}`
              : "Not subscribed"
          } accent={isPro ? "#34d399" : undefined} />
          <div className="mt-4 flex items-center gap-2">
            <label className="text-xs" style={{ fontFamily: MONO, color: "rgba(245,247,250,0.6)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Months</label>
            <input type="number" min={1} max={24} value={months} onChange={(e) => setMonths(Math.max(1, Math.min(24, +e.target.value || 1)))}
              className="w-16 bg-transparent px-2 py-1.5 rounded text-sm"
              style={{ border: "1px solid rgba(34,211,238,0.2)", color: "#f5f7fa" }} />
            <button onClick={doSubscribe} disabled={!address || !onMonad || !IS_CONFIGURED || !!busy}
              className="ml-auto cta-cyan rounded-[6px] px-3 py-2 text-xs disabled:opacity-40"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {busy === "subscribe" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Subscribe"}
            </button>
          </div>
        </Panel>

        {/* Watchlist */}
        <Panel icon={<Coins className="h-4 w-4" style={{ color: "#22d3ee" }} />} title="On-Chain Watchlist">
          <div className="flex gap-2">
            <input value={tickerInput} onChange={(e) => setTickerInput(e.target.value)} placeholder="MON, WBTC, USDC…"
              className="flex-1 bg-transparent px-3 py-2 rounded text-sm outline-none"
              style={{ border: "1px solid rgba(34,211,238,0.2)", color: "#f5f7fa" }}
              onKeyDown={(e) => { if (e.key === "Enter") addTicker(); }} />
            <button onClick={addTicker} disabled={!address || !onMonad || !IS_CONFIGURED || !!busy || !tickerInput.trim()}
              className="cta-cyan rounded-[6px] px-3 py-2 text-xs disabled:opacity-40"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {busy === "watchlist" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 min-h-[2rem]">
            {watchlist.length === 0 && <span className="text-xs" style={{ color: "rgba(245,247,250,0.4)" }}>No tickers yet.</span>}
            {watchlist.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs tabular-nums"
                style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", color: "#f5f7fa", fontFamily: MONO, letterSpacing: "0.1em" }}>
                {s}
                <button onClick={() => removeTicker(s)} className="opacity-60 hover:opacity-100" aria-label={`Remove ${s}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 text-[0.62rem]" style={{ fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.4)" }}>
            Stored as bytes32 on Monad · max 32 tickers
          </div>
        </Panel>

        {/* Portfolio snapshot */}
        <Panel icon={<FileSignature className="h-4 w-4" style={{ color: "#22d3ee" }} />} title="Portfolio Snapshot">
          <Stat label="Snapshots committed" value={snapshotCount.toString()} accent="#22d3ee" />
          <textarea value={portfolioNote} onChange={(e) => setPortfolioNote(e.target.value)} placeholder="Optional note or IPFS URI…"
            rows={2} className="mt-3 w-full bg-transparent px-3 py-2 rounded text-sm outline-none resize-none"
            style={{ border: "1px solid rgba(34,211,238,0.2)", color: "#f5f7fa" }} />
          <button onClick={commitSnapshot} disabled={!address || !onMonad || !IS_CONFIGURED || !!busy}
            className="mt-3 w-full cta-cyan rounded-[6px] px-3 py-2.5 text-xs disabled:opacity-40"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {busy === "snapshot" ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Commit Hash to Monad"}
          </button>
          <div className="mt-3 text-[0.62rem]" style={{ fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.4)" }}>
            keccak256(note + address + timestamp) · verifiable forever
          </div>
        </Panel>

        {/* Global stats */}
        <Panel icon={<Wallet className="h-4 w-4" style={{ color: "#22d3ee" }} />} title="Registry State">
          <Stat label="Chain" value={`Monad ${CHAIN_LABEL}`} accent="#22d3ee" />
          <Stat label="Published briefs" value={totalBriefs.toString()} />
          <Stat label="Contract" value={IS_CONFIGURED ? `${AEGIS_CONTRACT_ADDRESS.slice(0, 10)}…` : "Not deployed"} />
          {IS_CONFIGURED && (
            <a href={explorerAddress(AEGIS_CONTRACT_ADDRESS)} target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs" style={{ color: "#22d3ee", fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              View on explorer <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] p-5 hover-lift"
      style={{ background: "linear-gradient(180deg, rgba(10,18,28,0.7), rgba(4,10,16,0.7))", border: "1px solid rgba(34,211,238,0.14)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px]"
          style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.28)" }}>
          {icon}
        </span>
        <div style={{ fontFamily: SERIF, fontSize: "1.05rem", color: "#f5f7fa", letterSpacing: "-0.01em" }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[rgba(34,211,238,0.08)] last:border-0">
      <span className="text-xs" style={{ fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.55)" }}>{label}</span>
      <span className="text-sm tabular-nums" style={{ color: accent ?? "#f5f7fa", fontFamily: MONO }}>{value}</span>
    </div>
  );
}