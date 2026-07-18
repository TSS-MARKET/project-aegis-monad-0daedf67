import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Compass, MessageSquare, Radar, Wallet, LineChart } from "lucide-react";
import { AegisLogo } from "./logo";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: "Market Brief", icon: Activity, exact: true },
  { to: "/app/opportunities", label: "Opportunities", icon: Compass },
  { to: "/app/tokens", label: "Token Explorer", icon: LineChart },
  { to: "/app/whales", label: "Whale Radar", icon: Radar },
  { to: "/app/wallet", label: "Wallet Intelligence", icon: Wallet },
  { to: "/app/chat", label: "Ask Aegis", icon: MessageSquare },
];

export function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/40 backdrop-blur-xl">
      <div className="p-5 border-b border-border/60">
        <Link to="/">
          <AegisLogo />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                active
                  ? "bg-sidebar-accent text-foreground shadow-[inset_0_0_0_1px_var(--sidebar-border)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <it.icon className={cn("h-4 w-4", active && "text-primary")} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.17_155)] animate-pulse-glow" />
          Monad testnet · live
        </div>
      </div>
    </aside>
  );
}