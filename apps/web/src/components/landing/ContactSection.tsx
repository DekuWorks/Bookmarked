import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const btnBase =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-opacity min-h-[44px] px-6 py-2.5";

export function ContactSection() {
  return (
    <section id="contact" className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center shadow-sm md:p-10">
        <h2 className="text-2xl font-bold text-puce-red">Get in touch</h2>
        <p className="mt-2 text-text-muted">
          Questions, feedback, or ideas? We would love to hear from you.
        </p>
        <a
          href="mailto:hello@bookmarked.app"
          className="mt-4 inline-block text-lg font-medium text-puce-red underline hover:no-underline"
        >
          hello@bookmarked.app
        </a>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className={cn(btnBase, "bg-royal-orange text-white hover:opacity-90")}
          >
            Create a free account
          </Link>
          <Link
            href="/login"
            className={cn(
              btnBase,
              "border-2 border-primary bg-transparent text-puce-red hover:bg-primary/10"
            )}
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
