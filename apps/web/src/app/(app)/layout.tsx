import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ClientAuthGuard } from "@/components/auth/ClientAuthGuard";
import { ToastProvider } from "@/components/ui/Toast";
import { LoadingState } from "@/components/ui/LoadingState";
import { layout } from "@/lib/constants/layout";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <Navbar variant="app" />
      <main id="main-content" className={layout.appMain}>
        <Suspense fallback={<LoadingState message="Loading your library…" />}>
          <ClientAuthGuard>{children}</ClientAuthGuard>
        </Suspense>
      </main>
    </ToastProvider>
  );
}
