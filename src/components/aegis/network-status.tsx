import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMonadNetworkStatus } from "@/lib/monad-rpc.functions";
import { Activity } from "lucide-react";

const MONO = "var(--font-mono)";

export function NetworkStatus({ compact = false }: { compact?: boolean }) {
  const fn = useServerFn(getMonadNetworkStatus);
  const q = useQuery({
    queryKey: ["monad-net"],
    queryFn: () => fn(),
    refetchInterval: 8_000,
    staleTime: 6_000,
  });
  const d = q.data;
  const live = d && "blockNumber" in d ? d : null;
  const ok = !!live;
  const dot = ok ? "#22d3ee" : "#fb7185";
  const label = ok ? live!.chainName : d ? "RPC unreachable" : "Probing Monad RPC";
  const block = ok ? "#" + live!.blockNumber.toLocaleString() : "—";
  const gas = ok && live!.gasPriceGwei != null ? live!.gasPriceGwei.toFixed(2) + " gwei" : "—";
  const lat = ok ? live!.latencyMs + "ms" : "—";
  return (
    <div
      className="inline-flex items-center gap-2 md:gap-3 px-2.5 py-1.5 rounded-[6px]"
      style={{
        background: "rgba(4,10,16,0.7)",
        border: "1px solid rgba(34,211,238,0.22)",
        fontFamily: MONO,
        fontSize: "0.6rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(245,247,250,0.75)",
      }}
      title={ok ? `${live!.chainName} · block ${live!.blockNumber} · ${lat}` : "Monad RPC unavailable"}
    >
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: dot, opacity: 0.5 }} />
        <span className="relative inline-block h-2 w-2 rounded-full" style={{ background: dot }} />
      </span>
      <Activity className="h-3 w-3" style={{ color: "#22d3ee" }} />
      <span style={{ color: "#22d3ee" }}>{label}</span>
      {!compact && (
        <>
          <span style={{ color: "rgba(245,247,250,0.35)" }}>|</span>
          <span>BLK {block}</span>
          <span style={{ color: "rgba(245,247,250,0.35)" }}>|</span>
          <span>GAS {gas}</span>
          <span style={{ color: "rgba(245,247,250,0.35)" }}>|</span>
          <span>{lat}</span>
        </>
      )}
    </div>
  );
}