import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarNav } from "@/components/aegis/sidebar-nav";
import { MobileBottomNav } from "@/components/aegis/mobile-bottom-nav";
import { AegisLogo } from "@/components/aegis/logo";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

function AppShell() {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 border-b border-[rgba(34,211,238,0.14)] bg-black/70 backdrop-blur-xl">
          <Link to="/"><AegisLogo /></Link>
          <span
            className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1.5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22d3ee", boxShadow: "0 0 8px rgba(34,211,238,0.7)" }} />
            Live
          </span>
        </header>
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}