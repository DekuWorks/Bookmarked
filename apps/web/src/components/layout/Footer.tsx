import Link from "next/link";
import { layout } from "@/lib/constants/layout";
import { CONTACT_EMAIL } from "@/lib/constants/contact";

export function Footer() {
  return (
    <footer className="bg-puce-red text-white">
      <div
        className={`${layout.container} flex w-full flex-col items-center justify-center gap-8 py-12 text-center`}
      >
        <div className="mx-auto max-w-md">
          <p className="text-xl font-bold text-orange-yellow">Bookmarked</p>
          <p className="mx-auto mt-2 text-sm text-white/80">
            Your cozy corner of the internet for tracking reads, shelves, and reviews.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center text-sm font-medium text-orange-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-yellow rounded-sm"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <nav
          aria-label="Footer"
          className="flex w-full flex-col items-center justify-center gap-3 text-sm sm:flex-row sm:gap-8"
        >
          <Link
            href="/terms"
            className="inline-flex min-h-[44px] items-center justify-center hover:text-orange-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-yellow rounded-sm"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-[44px] items-center justify-center hover:text-orange-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-yellow rounded-sm"
          >
            Privacy
          </Link>
          <Link
            href="/#contact"
            className="inline-flex min-h-[44px] items-center justify-center hover:text-orange-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-yellow rounded-sm"
          >
            Contact
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © 2026 Bookmarked. All rights reserved.
      </div>
    </footer>
  );
}
