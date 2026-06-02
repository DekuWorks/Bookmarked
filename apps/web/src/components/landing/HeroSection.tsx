import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const btnBase =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-opacity min-h-[52px] px-6 py-3 text-lg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-background to-background px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl text-center">
        <p className="mb-4 inline-block rounded-full bg-orange-yellow/40 px-4 py-1 text-sm font-medium text-puce-red">
          Web-first · Mobile coming soon
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-puce-red md:text-5xl lg:text-6xl">
          Your reading life,{" "}
          <span className="text-primary">beautifully bookmarked</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted md:text-xl">
          Search books, organize shelves, track progress, and share reviews — all in one cozy,
          reader-focused home on the web.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className={cn(btnBase, "bg-royal-orange text-white hover:opacity-90")}
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className={cn(
              btnBase,
              "border-2 border-primary text-primary bg-transparent hover:bg-primary/10"
            )}
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
