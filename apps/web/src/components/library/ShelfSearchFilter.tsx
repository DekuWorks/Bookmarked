"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { ShelfSortSelect } from "@/components/library/ShelfSortSelect";
import { ShelfViewShell } from "@/components/library/LibraryViewShell";
import { useShelfSort } from "@/lib/hooks/useShelfSort";
import type { ShelfGroup } from "@/lib/services/library";
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
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="mb-3 text-center text-sm font-medium text-puce-red">Organize shelf</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Search this shelf"
            name="shelf-search"
            placeholder="Filter by title or author"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ShelfSortSelect
            value={sort}
            onChange={setSort}
            shelfStatus={shelf.status}
          />
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
