import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Bookmarked profile, reading streak, and account settings.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
