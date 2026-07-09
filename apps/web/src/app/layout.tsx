import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SupabaseConfigError } from "@/components/layout/SupabaseConfigError";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bookmarked — Your reading life, beautifully organized",
    template: "%s · Bookmarked",
  },
  description:
    "A web-first reading platform to search books, manage shelves, track progress, and write reviews.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SupabaseConfigError />
        {children}
      </body>
    </html>
  );
}
