import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library",
  description: "Organize your bookshelves, custom collections, and reading lists.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
