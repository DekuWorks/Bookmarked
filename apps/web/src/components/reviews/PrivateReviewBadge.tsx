import { PRIVATE_REVIEW_BADGE } from "@bookmarked/utils/reviewVisibility";
import { cn } from "@/lib/utils/cn";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M5 7.25V5.5a3 3 0 1 1 6 0v1.75"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect
        x="3.25"
        y="7.25"
        width="9.5"
        height="6.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

type Props = {
  className?: string;
};

export function PrivateReviewBadge({ className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5",
        "text-xs font-medium text-text-muted dark:border-border dark:bg-surface dark:text-text-muted",
        className
      )}
      aria-label={PRIVATE_REVIEW_BADGE.ariaLabel}
    >
      <LockIcon className="h-3 w-3 shrink-0" />
      {PRIVATE_REVIEW_BADGE.label}
    </span>
  );
}
