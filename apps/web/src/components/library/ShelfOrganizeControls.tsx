"use client";

import { ShelfSortSelect, SHELF_ORGANIZE_CONTROL_CLASS } from "@/components/library/ShelfSortSelect";
import type { ShelfSortMode } from "@/lib/utils/shelfSort";
import { cn } from "@/lib/utils/cn";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  sort: ShelfSortMode;
  onSortChange: (mode: ShelfSortMode) => void;
  shelfStatus?: string;
  className?: string;
};

export function ShelfOrganizeControls({
  query,
  onQueryChange,
  sort,
  onSortChange,
  shelfStatus,
  className,
}: Props) {
  return (
    <div className={cn("mx-auto w-full max-w-4xl surface-card p-4", className)}>
      <p className="mb-3 text-center text-sm font-medium text-puce-red">Organize shelf</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-center">
        <label className="block w-full text-left sm:max-w-sm">
          <span className="mb-1 block text-xs font-medium leading-4 text-text-muted">
            Filter by title or author
          </span>
          <input
            type="search"
            name="shelf-search"
            placeholder="Filter by title or author"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className={SHELF_ORGANIZE_CONTROL_CLASS}
            aria-label="Filter by title or author"
          />
        </label>
        <ShelfSortSelect
          value={sort}
          onChange={onSortChange}
          shelfStatus={shelfStatus}
          className="w-full text-left sm:w-56"
        />
      </div>
    </div>
  );
}
