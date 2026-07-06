"use client";

import { useEffect, useRef } from "react";
import type { LibraryBookRow } from "@/lib/services/library";
import { refreshStaleCatalogBooks } from "@/lib/services/staleCatalogRefresh";

const DEBOUNCE_MS = 1500;

/**
 * Debounced background catalog refresh when library books are loaded.
 */
export function useStaleCatalogRefresh(
  books: LibraryBookRow[] | null | undefined,
  onBooksUpdated?: () => void
): void {
  const onBooksUpdatedRef = useRef(onBooksUpdated);
  onBooksUpdatedRef.current = onBooksUpdated;

  useEffect(() => {
    if (!books?.length) return;

    const timer = window.setTimeout(() => {
      void refreshStaleCatalogBooks(books, {
        onBookUpdated: () => onBooksUpdatedRef.current?.(),
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [books]);
}
