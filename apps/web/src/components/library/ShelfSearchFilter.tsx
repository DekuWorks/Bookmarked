"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { ShelfViewShell } from "@/components/library/LibraryViewShell";
import type { ShelfGroup } from "@/lib/services/library";
import {
  SHELF_SORT_OPTIONS,
  sortShelfItems,
  type ShelfSortMode,
} from "@/lib/utils/shelfSort";
import type { LibraryViewMode } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  shelf: ShelfGroup;
  initialView: LibraryViewMode;
  username?: string;
  showHeaderLink?: boolean;
};

export function ShelfSearchFilter({
  shelf,
  initialView,
  username,
  showHeaderLink = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ShelfSortMode>("recently_added");

  const displayShelf = useMemo((): ShelfGroup => {
    const q = query.trim().toLowerCase();
    let items = shelf.items;

    if (q) {
      items = items.filter((ub) => {
        const title = ub.books?.title?.toLowerCase() ?? "";
        const author = ub.books?.author?.toLowerCase() ?? "";
        return title.includes(q) || author.includes(q);
      });
    }

    return {
      ...shelf,
      items: sortShelfItems(items, sort),
    };
  }, [shelf, query, sort]);

  const isEmpty = shelf.items.length === 0;
  const noMatches = !isEmpty && displayShelf.items.length === 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <Input
            label="Search this shelf"
            name="shelf-search"
            placeholder="Filter by title or author"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="shrink-0">
          <p className="mb-1.5 text-sm font-medium text-text">Sort by</p>
          <div
            className="inline-flex max-w-full flex-wrap rounded-lg border border-border bg-surface p-1 shadow-sm"
            role="group"
            aria-label="Sort shelf books"
          >
            {SHELF_SORT_OPTIONS.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                aria-pressed={sort === mode}
                onClick={() => setSort(mode)}
                className={cn(
                  "min-h-[44px] rounded-md px-2.5 py-2 text-xs font-medium transition sm:px-3 sm:text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                  sort === mode
                    ? "bg-puce-red text-white shadow-sm"
                    : "text-text-muted hover:bg-background hover:text-text"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isEmpty ? (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
          No books on this shelf yet.
        </p>
      ) : noMatches ? (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
          No books match &ldquo;{query}&rdquo; on this shelf.
        </p>
      ) : (
        <ShelfViewShell
          initialView={initialView}
          shelves={[displayShelf]}
          username={username}
          showHeaderLink={showHeaderLink}
        />
      )}
    </div>
  );
}
