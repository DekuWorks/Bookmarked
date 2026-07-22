import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your Bookmarked account and start tracking your reading life.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
