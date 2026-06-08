"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { ShelfViewShell } from "@/components/library/LibraryViewShell";
import type { ShelfGroup } from "@/lib/services/library";
import type { LibraryViewMode } from "@/types";

type Props = {
  shelf: ShelfGroup;
  initialView: LibraryViewMode;
};

export function ShelfSearchFilter({ shelf, initialView }: Props) {
  const [query, setQuery] = useState("");

  const filteredShelf = useMemo((): ShelfGroup => {
    const q = query.trim().toLowerCase();
    if (!q) return shelf;
    return {
      ...shelf,
      items: shelf.items.filter((ub) => {
        const title = ub.books?.title?.toLowerCase() ?? "";
        const author = ub.books?.author?.toLowerCase() ?? "";
        return title.includes(q) || author.includes(q);
      }),
    };
  }, [shelf, query]);

  return (
    <div className="space-y-6">
      <Input
        label="Search this shelf"
        name="shelf-search"
        placeholder="Filter by title or author"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filteredShelf.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
          No books match &ldquo;{query}&rdquo; on this shelf.
        </p>
      ) : (
        <ShelfViewShell initialView={initialView} shelves={[filteredShelf]} />
      )}
    </div>
  );
}
