import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming book club events, read-alongs, and community meetups on Bookmarked.",
};

export default function EventsLayout({ children }: { children: ReactNode }) {
  return children;
}
