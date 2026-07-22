import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Bookmarked account.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
