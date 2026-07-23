import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reading Room",
  description: "Your reading-life hub — progress, trail, notes, reviews, and history.",
};

export default function ReadingRoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
