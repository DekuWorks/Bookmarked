import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reading Room",
  description: "Redirects to Reading Room — your home for reading progress and activity.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
