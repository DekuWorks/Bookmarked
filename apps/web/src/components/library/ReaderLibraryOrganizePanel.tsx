"use client";

import { useMemo } from "react";
import { BookshelfView } from "@/components/library/BookshelfView";
import { ShelfSortSelect } from "@/components/library/ShelfSortSelect";
import { useShelfSort } from "@/lib/hooks/useShelfSort";
import type { ShelfGroup } from "@/lib/services/library";
import { sortShelfGroups } from "@/lib/utils/shelfSort";

type Props = {
  shelves: ShelfGroup[];
  username?: string;
  sortKey: string;
};

export function ReaderLibraryOrganizePanel({ shelves, username, sortKey }: Props) {
  const { sort, setSort } = useShelfSort(sortKey);

  const sortedShelves = useMemo(
    () => sortShelfGroups(shelves, sort) as ShelfGroup[],
    [shelves, sort]
  );

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="mb-3 text-center text-sm font-medium text-puce-red">Organize library</p>
        <div className="flex justify-center">
          <ShelfSortSelect
            value={sort}
            onChange={setSort}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <BookshelfView shelves={sortedShelves} username={username} />
    </div>
  );
}
