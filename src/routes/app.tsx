import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarNav } from "@/components/aegis/sidebar-nav";
import { FloatingChat } from "@/components/aegis/floating-chat";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

function AppShell() {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      <FloatingChat />
    </div>
  );
}