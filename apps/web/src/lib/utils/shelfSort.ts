import type { LibraryBookRow } from "@/lib/services/library";

/** Minimal shape for client-side shelf sorting (library + custom shelves). */
export type SortableShelfItem = {
  id: string;
  created_at: string;
  updated_at?: string;
  progress_percent?: number;
  expected_read_date?: string | null;
  books: {
    title?: string | null;
    author?: string | null;
    published_date?: string | null;
  } | null;
};

export type ShelfSortMode =
  | "title_asc"
  | "title_desc"
  | "author_asc"
  | "published_newest"
  | "published_oldest"
  | "added_newest"
  | "added_oldest"
  | "date_to_read"
  | "progress_updated";

export const DEFAULT_SHELF_SORT: ShelfSortMode = "added_newest";

export type ShelfSortOption = {
  mode: ShelfSortMode;
  label: string;
  /** Only shown on currently-reading shelves */
  readingOnly?: boolean;
};

export const SHELF_SORT_OPTIONS: ShelfSortOption[] = [
  { mode: "title_asc", label: "Title A–Z" },
  { mode: "title_desc", label: "Title Z–A" },
  { mode: "author_asc", label: "Author A–Z" },
  { mode: "published_newest", label: "Date released (newest)" },
  { mode: "published_oldest", label: "Date released (oldest)" },
  { mode: "added_newest", label: "Date added (newest)" },
  { mode: "added_oldest", label: "Date added (oldest)" },
  { mode: "date_to_read", label: "Date to read (soonest)" },
  { mode: "progress_updated", label: "Recently updated progress", readingOnly: true },
];

const LEGACY_SORT_MAP: Record<string, ShelfSortMode> = {
  recently_added: "added_newest",
  title: "title_asc",
  author: "author_asc",
};

export function parseShelfSortMode(value: string | null | undefined): ShelfSortMode {
  if (!value) return DEFAULT_SHELF_SORT;
  if (LEGACY_SORT_MAP[value]) return LEGACY_SORT_MAP[value];
  if (SHELF_SORT_OPTIONS.some((opt) => opt.mode === value)) {
    return value as ShelfSortMode;
  }
  return DEFAULT_SHELF_SORT;
}

export function getShelfSortOptions(
  shelfStatus?: string
): ShelfSortOption[] {
  const isReading = shelfStatus === "currently_reading";
  return SHELF_SORT_OPTIONS.filter((opt) => !opt.readingOnly || isReading);
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function parsePublishedDate(value: string | null | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const yearOnly = /^\d{4}$/.test(trimmed);
  const parsed = Date.parse(yearOnly ? `${trimmed}-01-01` : trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortShelfItems<T extends SortableShelfItem>(
  items: T[],
  mode: ShelfSortMode
): T[] {
  const sorted = [...items];

  switch (mode) {
    case "title_asc":
      sorted.sort((a, b) =>
        compareStrings(a.books?.title ?? "", b.books?.title ?? "")
      );
      break;
    case "title_desc":
      sorted.sort((a, b) =>
        compareStrings(b.books?.title ?? "", a.books?.title ?? "")
      );
      break;
    case "author_asc":
      sorted.sort((a, b) => {
        const authorCmp = compareStrings(
          a.books?.author ?? "",
          b.books?.author ?? ""
        );
        if (authorCmp !== 0) return authorCmp;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
    case "published_newest":
      sorted.sort((a, b) => {
        const dateCmp =
          parsePublishedDate(b.books?.published_date) -
          parsePublishedDate(a.books?.published_date);
        if (dateCmp !== 0) return dateCmp;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
    case "published_oldest":
      sorted.sort((a, b) => {
        const aDate = parsePublishedDate(a.books?.published_date);
        const bDate = parsePublishedDate(b.books?.published_date);
        if (aDate === 0 && bDate !== 0) return 1;
        if (bDate === 0 && aDate !== 0) return -1;
        const dateCmp = aDate - bDate;
        if (dateCmp !== 0) return dateCmp;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
    case "added_oldest":
      sorted.sort(
        (a, b) =>
          parseTimestamp(a.created_at) - parseTimestamp(b.created_at)
      );
      break;
    case "date_to_read":
      // Real "Date to Read" column (expected_read_date), soonest first; rows
      // without a target date sort to the end.
      sorted.sort((a, b) => {
        const aDate = a.expected_read_date
          ? parseTimestamp(a.expected_read_date)
          : Number.POSITIVE_INFINITY;
        const bDate = b.expected_read_date
          ? parseTimestamp(b.expected_read_date)
          : Number.POSITIVE_INFINITY;
        if (aDate !== bDate) return aDate - bDate;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
    case "progress_updated":
      sorted.sort((a, b) => {
        const updatedCmp =
          parseTimestamp(b.updated_at) - parseTimestamp(a.updated_at);
        if (updatedCmp !== 0) return updatedCmp;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
    case "added_newest":
    default:
      sorted.sort(
        (a, b) =>
          parseTimestamp(b.created_at) - parseTimestamp(a.created_at)
      );
      break;
  }

  return sorted;
}

/** Apply sort to every shelf group (library overview). */
export function sortShelfGroups<T extends SortableShelfItem>(
  shelves: { items: T[]; status?: string; slug?: string }[],
  mode: ShelfSortMode
): { items: T[]; status?: string; slug?: string }[] {
  return shelves.map((shelf) => ({
    ...shelf,
    items: sortShelfItems(shelf.items, mode),
  }));
}

export function sortLibraryBookRows(
  items: LibraryBookRow[],
  mode: ShelfSortMode
): LibraryBookRow[] {
  return sortShelfItems(items, mode);
}

/** Alias for sortLibraryBookRows — sorts library book rows client-side. */
export const sortLibraryBooks = sortLibraryBookRows;
