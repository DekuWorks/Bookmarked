import {
  DEFAULT_OG_IMAGE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/constants/site";
import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SupabaseConfigError } from "@/components/layout/SupabaseConfigError";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_TAGLINE } from "@/lib/seo/sharePreview";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bookmarked.online"),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "A web-first reading platform to search books, manage shelves, track progress, and write reviews.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_TAGLINE,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 512,
        height: 488,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_TAGLINE,
    images: [DEFAULT_OG_IMAGE],
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="bookmarked-theme-init" strategy="beforeInteractive">
          {`(function(){try{var p=localStorage.getItem("bookmarked_theme")||"system";var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SupabaseConfigError />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
