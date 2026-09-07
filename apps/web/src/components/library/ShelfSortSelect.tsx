"use client";

import { getShelfSortOptions, type ShelfSortMode } from "@/lib/utils/shelfSort";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: ShelfSortMode;
  onChange: (mode: ShelfSortMode) => void;
  shelfStatus?: string;
  className?: string;
  id?: string;
};

export const SHELF_ORGANIZE_CONTROL_CLASS = cn(
  "box-border h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm leading-none text-text",
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
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium leading-4 text-text-muted">Sort by</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as ShelfSortMode)}
        className={SHELF_ORGANIZE_CONTROL_CLASS}
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
