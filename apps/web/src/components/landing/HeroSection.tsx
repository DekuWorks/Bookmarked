import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const btnBase =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-opacity min-h-[52px] px-6 py-3 text-lg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-background to-background px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl text-center">
        <p className="mb-4 inline-block rounded-full bg-orange-yellow/40 px-4 py-1 text-sm font-medium text-puce-red">
          Web-first · Mobile coming soon
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-puce-red sm:text-4xl md:text-5xl lg:text-6xl">
          We believe every reader{" "}
          <span className="text-primary">deserves a home</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-text-muted sm:text-lg md:text-xl">
          Search books, organize shelves, track progress, and share reviews — all in one cozy,
          reader-focused home on the web.
        </p>
        <div className="mx-auto mt-10 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <Link
            href="/signup"
            className={cn(btnBase, "w-full bg-royal-orange text-white hover:opacity-90 sm:w-auto")}
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className={cn(
              btnBase,
              "w-full border-2 border-primary bg-transparent text-puce-red hover:bg-primary/10 sm:w-auto"
            )}
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
