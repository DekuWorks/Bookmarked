import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  compact?: boolean;
  /** @deprecated Prefer default "Plus" label */
  label?: "Plus" | "Premium" | "Home";
};

/** Soft membership badge for Plus/Home surfaces. */
export function PlusBadge({ className, compact, label = "Plus" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary/25 font-semibold uppercase tracking-wide text-puce-red dark:bg-primary/30 dark:text-primary",
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
      aria-label={`Bookmarked ${label}`}
    >
      {label}
    </span>
  );
}
