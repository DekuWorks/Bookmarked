import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reading Room",
  description: "Your reading-life hub — Progress, Trail, Notes, Reviews, and History.",
};

export default function ReadingRoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
