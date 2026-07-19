import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, MessageSquare, Radar, Wallet, LineChart, Waves, Cpu, PlayCircle, Newspaper, Coffee } from "lucide-react";
import { AegisLogo } from "./logo";
import { cn } from "@/lib/utils";
import { WalletConnectButton } from "./wallet-connect";

const items = [
  { to: "/app", label: "Market Brief", icon: Activity, exact: true },
  { to: "/app/digest", label: "Daily Digest", icon: Coffee },
  { to: "/app/replay", label: "Replay the Chain", icon: PlayCircle },
  { to: "/app/timeline", label: "Intelligence Timeline", icon: Newspaper },
  { to: "/app/radar", label: "Market Radar", icon: Radar },
  { to: "/app/opportunities", label: "Opportunities", icon: LineChart },
  { to: "/app/tokens", label: "Token Explorer", icon: LineChart },
  { to: "/app/whales", label: "Whale Intelligence", icon: Waves },
  { to: "/app/wallet", label: "Wallet DNA", icon: Wallet },
  { to: "/app/onchain", label: "On-Chain Layer", icon: Cpu },
  { to: "/app/chat", label: "Ask Aegis", icon: MessageSquare },
];

export function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[rgba(34,211,238,0.12)] bg-black/60 backdrop-blur-xl">
      <div className="p-5 border-b border-[rgba(34,211,238,0.12)]">
        <Link to="/">
          <AegisLogo />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "group relative flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm transition-colors",
                active
                  ? "text-foreground bg-[rgba(34,211,238,0.06)] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]",
              )}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r"
                  style={{ background: "#22d3ee", boxShadow: "0 0 8px rgba(34,211,238,0.7)" }}
                />
              )}
              <it.icon className={cn("h-4 w-4", active ? "text-[#22d3ee]" : "")} strokeWidth={1.75} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[rgba(34,211,238,0.12)]">
        <WalletConnectButton />
        <div className="mt-3" />
        <div
          className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.7)" }}
          />
          Monad · Live
        </div>
      </div>
    </aside>
  );
}