import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ClientAuthGuard } from "@/components/auth/ClientAuthGuard";
import { BrowserNotificationsProvider } from "@/components/notifications/BrowserNotificationsProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { LoadingState } from "@/components/ui/LoadingState";
import { layout } from "@/lib/constants/layout";
import { cn } from "@/lib/utils/cn";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell-gradient flex min-h-full flex-1 flex-col">
      <ToastProvider>
        <Navbar variant="app" />
        <main
          id="main-content"
          className={cn(layout.appMain, "pb-28 md:pb-10")}
        >
          <Suspense fallback={<LoadingState message="Loading your library…" />}>
            <ClientAuthGuard>
              <BrowserNotificationsProvider>{children}</BrowserNotificationsProvider>
            </ClientAuthGuard>
          </Suspense>
        </main>
        <MobileBottomNav />
      </ToastProvider>
    </div>
  );
}
