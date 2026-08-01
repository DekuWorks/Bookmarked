/** Shared client-side pagination helpers for web + iOS. */

export const DEFAULT_PAGE_SIZE = 10;

export type PageSlice<T> = {
  pageItems: T[];
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
};

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
): PageSlice<T> {
  const size = Math.max(1, Math.floor(pageSize) || DEFAULT_PAGE_SIZE);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const startIndex = (safePage - 1) * size;
  const endIndex = Math.min(startIndex + size, total);

  return {
    pageItems: items.slice(startIndex, endIndex),
    page: safePage,
    totalPages,
    total,
    pageSize: size,
    startIndex,
    endIndex,
  };
}
