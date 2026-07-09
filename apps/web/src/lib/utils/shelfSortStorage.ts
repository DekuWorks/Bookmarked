import { DEFAULT_SHELF_SORT, parseShelfSortMode, type ShelfSortMode } from "@/lib/utils/shelfSort";

const STORAGE_PREFIX = "shelf-sort:";

export function shelfSortStorageKey(shelfKey: string): string {
  return `${STORAGE_PREFIX}${shelfKey}`;
}

export function readShelfSortFromStorage(shelfKey: string): ShelfSortMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(shelfSortStorageKey(shelfKey));
    if (!raw) return null;
    return parseShelfSortMode(raw);
  } catch {
    return null;
  }
}

export function writeShelfSortToStorage(shelfKey: string, mode: ShelfSortMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(shelfSortStorageKey(shelfKey), mode);
  } catch {
    // ignore quota / private mode
  }
}

export function resolveShelfSort(
  shelfKey: string,
  urlSort: string | null | undefined
): ShelfSortMode {
  if (urlSort) return parseShelfSortMode(urlSort);
  return readShelfSortFromStorage(shelfKey) ?? DEFAULT_SHELF_SORT;
}
