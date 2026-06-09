import { Navbar } from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <Navbar variant="app" />
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
    </ToastProvider>
  );
}
