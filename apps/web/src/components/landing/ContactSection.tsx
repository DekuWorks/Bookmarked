import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const btnBase =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-opacity min-h-[44px] px-6 py-2.5";

export function ContactSection() {
  return (
    <section id="contact" className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8 md:p-10">
        <h2 className="text-2xl font-bold text-puce-red sm:text-3xl">Get in touch</h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-text-muted">
          Questions, feedback, or ideas? We would love to hear from you.
        </p>
        <a
          href="mailto:hello@bookmarked.app"
          className="mt-4 inline-block text-lg font-medium text-puce-red underline hover:no-underline"
        >
          hello@bookmarked.app
        </a>
        <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className={cn(btnBase, "w-full bg-royal-orange text-white hover:opacity-90 sm:w-auto")}
          >
            Create a free account
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
