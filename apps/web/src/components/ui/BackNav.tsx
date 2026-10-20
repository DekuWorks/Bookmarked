"use client";

import { useRouter } from "next/navigation";
import { HistoryMenuButton } from "@/components/navigation/HistoryMenuButton";
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
 * The adjacent menu jumps to one of the three previous screens.
 */
export function BackNav({ label, fallbackHref, className, href }: Props) {
  const router = useRouter();

  return (
    <div className="inline-flex max-w-full items-center gap-0.5">
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
          "text-left text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
          className ?? "text-primary"
        )}
        aria-label={`Back to ${label}`}
      >
        ← Back to {label}
      </button>
      <HistoryMenuButton />
    </div>
  );
}
