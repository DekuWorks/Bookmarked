"use client";

import { cn } from "@/lib/utils/cn";
import { CURRENTLY_READING_ADD_COPY } from "@bookmarked/utils/overviewCopy";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={CURRENTLY_READING_ADD_COPY.cardLabel}
      className={cn(
        "relative aspect-[2/3] w-28 overflow-hidden rounded-xl border border-dashed border-border bg-background",
        "inline-flex items-center justify-center text-text-muted",
        "transition hover:border-primary hover:bg-primary/10 hover:text-puce-red",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
        className
      )}
    >
      <PlusIcon className="h-8 w-8" />
    </button>
  );
}
