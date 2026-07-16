"use client";

import { useId, useState, type ReactNode } from "react";
import { containsProfanity } from "@/lib/utils/profanity";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** Raw text used for detection (not necessarily what is rendered). */
  text: string;
  children: ReactNode;
  className?: string;
  /** Extra classes for the inner content wrapper. */
  contentClassName?: string;
};

/**
 * Whole-block blur when `text` contains curated profanity.
 * Click/keyboard to reveal; optional re-hide. Spoiler UX stays separate.
 */
export function ProfanityBlur({
  text,
  children,
  className,
  contentClassName,
}: Props) {
  const flagged = containsProfanity(text);
  const [revealed, setRevealed] = useState(false);
  const contentId = useId();

  if (!flagged) {
    return <div className={className}>{children}</div>;
  }

  const hidden = !revealed;

  return (
    <div className={cn("relative", className)}>
      <div
        id={contentId}
        className={cn(
          "transition-[filter] duration-200",
          hidden && "select-none blur-md pointer-events-none",
          contentClassName
        )}
        aria-hidden={hidden}
      >
        {children}
      </div>

      {hidden ? (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className={cn(
              "rounded-lg border border-border bg-surface/95 px-3 py-1.5 text-xs font-semibold text-puce-red shadow-sm",
              "hover:bg-primary/15",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2"
            )}
            aria-controls={contentId}
            aria-expanded={false}
            aria-label="Show content that may contain strong language"
          >
            Show content
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(false)}
          className={cn(
            "mt-1.5 text-xs font-medium text-text-muted hover:text-puce-red",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 rounded-sm"
          )}
          aria-controls={contentId}
          aria-expanded={true}
          aria-label="Hide content with strong language"
        >
          Hide content
        </button>
      )}
    </div>
  );
}
