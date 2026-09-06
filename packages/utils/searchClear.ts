/** Search category used by web + iOS Search. */
export type SearchClearMode = "books" | "people" | "clubs";

export type ClearedSearchHrefOptions = {
  mode?: SearchClearMode;
  origin?: string | null;
  shelf?: string | null;
};

/** True when the clear control should render. Empty query hides it entirely. */
export function shouldShowSearchClear(query: string): boolean {
  return query.length > 0;
}

/**
 * Search URL after clear: no `q`, same category, optional Overview-add params kept.
 * Web trailing slash matches existing Search routes.
 */
export function clearedSearchHref(options: ClearedSearchHrefOptions = {}): string {
  const params = new URLSearchParams();
  if (options.mode && options.mode !== "books") {
    params.set("cat", options.mode);
  }
  if (options.origin) {
    params.set("origin", options.origin);
  }
  if (options.shelf) {
    params.set("shelf", options.shelf);
  }
  const qs = params.toString();
  return qs ? `/search/?${qs}` : "/search/";
}

export type SearchRequestGuard = {
  next: () => number;
  isCurrent: (id: number) => boolean;
  invalidate: () => void;
};

/**
 * Monotonic request id so a late “Fourth Wing” response cannot refill an emptied search.
 * Pair with AbortController / query-key cancel at the call site.
 */
export function createSearchRequestGuard(): SearchRequestGuard {
  let current = 0;
  return {
    next() {
      current += 1;
      return current;
    },
    isCurrent(id: number) {
      return id === current;
    },
    invalidate() {
      current += 1;
    },
  };
}
