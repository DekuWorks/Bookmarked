import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search books by title or author and add them to your library.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
