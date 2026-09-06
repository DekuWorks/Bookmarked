import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Book Map",
  description: "Find independent bookstores, libraries, and reading cafés on Bookmarked Home.",
};

export default function BookMapLayout({ children }: { children: ReactNode }) {
  return children;
}
