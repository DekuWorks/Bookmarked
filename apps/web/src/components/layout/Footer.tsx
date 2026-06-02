import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-puce-red text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:justify-between md:px-8">
        <div>
          <p className="text-xl font-bold text-primary">Bookmarked</p>
          <p className="mt-2 max-w-sm text-sm text-white/80">
            Your cozy corner of the internet for tracking reads, shelves, and reviews.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/terms" className="hover:text-orange-yellow">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-orange-yellow">
            Privacy
          </Link>
          <a href="mailto:hello@bookmarked.app" className="hover:text-orange-yellow">
            Contact
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Bookmarked. All rights reserved.
      </div>
    </footer>
  );
}
