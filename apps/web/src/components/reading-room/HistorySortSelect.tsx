"use client";

import {
  HISTORY_SORT_OPTIONS,
  type HistorySortMode,
} from "@bookmarked/utils/readingRoomHistory";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: HistorySortMode;
  onChange: (mode: HistorySortMode) => void;
  className?: string;
  id?: string;
};

const selectClass = cn(
  "min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text sm:w-auto",
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
);

export function HistorySortSelect({
  value,
  onChange,
  className,
  id = "history-sort",
}: Props) {
  return (
    <label className={cn("block text-left", className)}>
      <span className="mb-1 block text-xs font-medium text-text-muted">Sort by</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as HistorySortMode)}
        className={selectClass}
        aria-label="Sort finished books"
      >
        {HISTORY_SORT_OPTIONS.map((opt) => (
          <option key={opt.mode} value={opt.mode}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
