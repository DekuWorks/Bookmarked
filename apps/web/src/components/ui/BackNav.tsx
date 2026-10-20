"use client";

import { useRouter } from "next/navigation";
import { UNIVERSAL_BACK_LINK_LABEL } from "@bookmarked/utils/navigationOrigin";
import { HistoryMenuButton } from "@/components/navigation/HistoryMenuButton";
import { useNavHistory } from "@/lib/navigation/NavHistoryProvider";
import { cn } from "@/lib/utils/cn";

type Props = {
  /**
   * Destination word used only for the accessible name when `href` is set.
   * The visible label stays "Back to".
   */
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
 * Visible text is always "← Back to".
 */
export function BackNav({ label, fallbackHref, className, href }: Props) {
  const router = useRouter();
  const { previous } = useNavHistory();
  const destination = href ? label : previous[0]?.title;
  const accessibleName = destination ? `Back to ${destination}` : "Back to";

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
        aria-label={accessibleName}
      >
        {UNIVERSAL_BACK_LINK_LABEL}
      </button>
      <HistoryMenuButton />
    </div>
  );
}
