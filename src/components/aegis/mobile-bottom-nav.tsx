import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Radar, PlayCircle, Newspaper, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: "Brief", icon: Activity, exact: true },
  { to: "/app/replay", label: "Replay", icon: PlayCircle },
  { to: "/app/timeline", label: "Feed", icon: Newspaper },
  { to: "/app/radar", label: "Radar", icon: Radar },
  { to: "/app/chat", label: "Ask", icon: MessageSquare },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[rgba(34,211,238,0.18)] bg-black/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[0.6rem] uppercase tracking-[0.12em] transition-colors",
                  active ? "text-[#22d3ee]" : "text-muted-foreground active:text-foreground",
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <it.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}