"use client";

import { cn } from "@/lib/utils/cn";
import { CURRENTLY_READING_ADD_COPY } from "@bookmarked/utils/overviewCopy";
import {
  CURRENTLY_READING_CARD_SIZE,
  currentlyReadingCardBoxStyle,
} from "@bookmarked/utils/currentlyReadingCard";

function PlusIcon({ sizePx }: { sizePx: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width={sizePx}
      height={sizePx}
      aria-hidden
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

type Props = {
  onClick: () => void;
  className?: string;
};

export function AddBookCoverCard({ onClick, className }: Props) {
  const size = CURRENTLY_READING_CARD_SIZE.web;
  const box = currentlyReadingCardBoxStyle("web");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={CURRENTLY_READING_ADD_COPY.cardLabel}
      style={{
        width: box.width,
        minHeight: box.height,
        borderRadius: box.borderRadius,
      }}
      className={cn(
        "inline-flex h-full shrink-0 items-center justify-center border border-border bg-primary/10 text-text-muted",
        "transition hover:border-primary hover:bg-primary/15 hover:text-puce-red",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
        className
      )}
    >
      <PlusIcon sizePx={size.plusIconPx} />
    </button>
  );
}
