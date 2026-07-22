import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed",
  description: "Discover readers, follow posts, and see what people you follow are reading.",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
