import { createFileRoute, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarNav } from "@/components/aegis/sidebar-nav";
import { MobileBottomNav } from "@/components/aegis/mobile-bottom-nav";
import { AegisLogo } from "@/components/aegis/logo";
import { DemoModeButton } from "@/components/aegis/demo-mode";
import { WalletConnectButton } from "@/components/aegis/wallet-connect";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

const APP_ROUTES = [
  "/app",
  "/app/digest",
  "/app/replay",
  "/app/timeline",
  "/app/radar",
  "/app/opportunities",
  "/app/tokens",
  "/app/whales",
  "/app/wallet",
  "/app/onchain",
  "/app/chat",
] as const;

function AppShell() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb) : setTimeout(cb, 200);
    idle(() => {
      APP_ROUTES.forEach((to) => {
        router.preloadRoute({ to }).catch(() => {});
      });
    });
  }, [router]);
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 border-b border-[rgba(34,211,238,0.14)] bg-black/70 backdrop-blur-xl">
          <Link to="/"><AegisLogo /></Link>
          <div className="flex items-center gap-2">
            <DemoModeButton variant="premium" />
            <WalletConnectButton compact />
          </div>
        </header>
        <div className="hidden md:flex items-center justify-end gap-3 px-6 pt-4">
          <DemoModeButton variant="premium" />
          <WalletConnectButton compact />
        </div>
        <div key={pathname} className="animate-in fade-in duration-150">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}