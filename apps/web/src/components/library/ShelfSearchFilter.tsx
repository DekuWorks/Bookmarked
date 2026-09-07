"use client";

import { useMemo, useState } from "react";
import { ShelfOrganizeControls } from "@/components/library/ShelfOrganizeControls";
import { ShelfViewShell } from "@/components/library/LibraryViewShell";
import { useShelfSort } from "@/lib/hooks/useShelfSort";
import type { ShelfGroup } from "@/lib/services/library";
import { filterItemsByTitleOrAuthor } from "@bookmarked/utils/shelfFilter";
import { sortShelfItems } from "@/lib/utils/shelfSort";
import type { LibraryViewMode } from "@/types";

type Props = {
  shelf: ShelfGroup;
  initialView: LibraryViewMode;
  username?: string;
  showHeaderLink?: boolean;
  sortKey?: string;
};

export function ShelfSearchFilter({
  shelf,
  initialView,
  username,
  showHeaderLink = true,
  sortKey,
}: Props) {
  const [query, setQuery] = useState("");
  const { sort, setSort } = useShelfSort(sortKey ?? shelf.slug);

  const displayShelf = useMemo((): ShelfGroup => {
    const items = sortShelfItems(filterItemsByTitleOrAuthor(shelf.items, query), sort);
    return { ...shelf, items };
  }, [shelf, query, sort]);

  const isEmpty = shelf.items.length === 0;
  const noMatches = !isEmpty && displayShelf.items.length === 0;

  return (
    <div className="animate-fade-in space-y-6">
      <ShelfOrganizeControls
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        shelfStatus={shelf.status}
      />

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
