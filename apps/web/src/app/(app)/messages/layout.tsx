import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description: "Direct messages and group chats with other readers.",
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
