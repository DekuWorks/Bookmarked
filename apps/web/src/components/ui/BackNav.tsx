"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** Shown in the control label, e.g. "discussions" → "← Back to discussions". */
  label: string;
  /** Used when the browser has no in-app history to return to. */
  fallbackHref: string;
  className?: string;
  /** When set, go here instead of history (origin-aware Feed/Search/Library). */
  href?: string;
};

/**
 * History-aware back control for deep/detail screens.
 * Prefers an explicit `href` (origin), then router.back(), then fallback.
 */
export function BackNav({ label, fallbackHref, className, href }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (href) {
          router.push(href);
          return;
        }
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className={cn(
        "text-left text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
        className
      )}
      aria-label={`Back to ${label}`}
    >
      ← Back to {label}
    </button>
  );
}
