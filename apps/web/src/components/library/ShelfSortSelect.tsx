"use client";

import {
  getShelfSortOptions,
  type ShelfSortMode,
} from "@/lib/utils/shelfSort";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: ShelfSortMode;
  onChange: (mode: ShelfSortMode) => void;
  shelfStatus?: string;
  className?: string;
  id?: string;
};

const selectClass = cn(
  "min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text sm:w-auto",
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
);

export function ShelfSortSelect({
  value,
  onChange,
  shelfStatus,
  className,
  id = "shelf-sort",
}: Props) {
  const options = getShelfSortOptions(shelfStatus);

  return (
    <label className={cn("block text-left", className)}>
      <span className="mb-1 block text-xs font-medium text-text-muted">Sort by</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as ShelfSortMode)}
        className={selectClass}
        aria-label="Sort shelf books"
      >
        {options.map((opt) => (
          <option key={opt.mode} value={opt.mode}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
