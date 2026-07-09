"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_SHELF_SORT,
  parseShelfSortMode,
  type ShelfSortMode,
} from "@/lib/utils/shelfSort";
import {
  readShelfSortFromStorage,
  writeShelfSortToStorage,
} from "@/lib/utils/shelfSortStorage";

export function useShelfSort(shelfKey: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSort = searchParams.get("sort");

  const [sort, setSortState] = useState<ShelfSortMode>(() => {
    if (urlSort) return parseShelfSortMode(urlSort);
    return readShelfSortFromStorage(shelfKey) ?? DEFAULT_SHELF_SORT;
  });

  useEffect(() => {
    const resolved = urlSort
      ? parseShelfSortMode(urlSort)
      : readShelfSortFromStorage(shelfKey) ?? DEFAULT_SHELF_SORT;
    setSortState(resolved);
  }, [urlSort, shelfKey]);

  const setSort = useCallback(
    (mode: ShelfSortMode) => {
      setSortState(mode);
      writeShelfSortToStorage(shelfKey, mode);

      const params = new URLSearchParams(searchParams.toString());
      if (mode === DEFAULT_SHELF_SORT) {
        params.delete("sort");
      } else {
        params.set("sort", mode);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, shelfKey]
  );

  return { sort, setSort };
}
