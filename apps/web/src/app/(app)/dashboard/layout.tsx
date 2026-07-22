import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your reading dashboard — continue reading, track goals, and see recent activity.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
