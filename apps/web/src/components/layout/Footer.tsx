import Link from "next/link";
import { layout } from "@/lib/constants/layout";

export function Footer() {
  return (
    <footer className="bg-puce-red text-white">
      <div
        className={`${layout.container} flex flex-col gap-8 py-12 md:flex-row md:justify-between`}
      >
        <div>
          <p className="text-xl font-bold text-orange-yellow">Bookmarked</p>
          <p className="mt-2 max-w-sm text-sm text-white/80">
            Your cozy corner of the internet for tracking reads, shelves, and reviews.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-8">
          <Link
            href="/terms"
            className="inline-flex min-h-[44px] items-center hover:text-orange-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-yellow rounded-sm"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-[44px] items-center hover:text-orange-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-yellow rounded-sm"
          >
            Privacy
          </Link>
          <a
            href="mailto:hello@bookmarked.app"
            className="inline-flex min-h-[44px] items-center hover:text-orange-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-yellow rounded-sm"
          >
            Contact
          </a>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © <span suppressHydrationWarning>{new Date().getFullYear()}</span> Bookmarked. All
        rights reserved.
      </div>
    </footer>
  );
}
