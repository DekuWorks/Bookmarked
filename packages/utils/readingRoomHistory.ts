/** Shared Reading Room history tab sorting — web + mobile. */

export type HistorySortableBook = {
  id: string;
  created_at: string;
  finished_at: string | null;
  updated_at?: string | null;
  books: {
    title?: string | null;
    author?: string | null;
  } | null;
};

export type HistorySortMode =
  | "title_asc"
  | "title_desc"
  | "author_asc"
  | "author_desc"
  | "added_newest"
  | "added_oldest";

export const DEFAULT_HISTORY_SORT: HistorySortMode = "added_newest";

export const HISTORY_SORT_OPTIONS: { mode: HistorySortMode; label: string }[] = [
  { mode: "title_asc", label: "Title A–Z" },
  { mode: "title_desc", label: "Title Z–A" },
  { mode: "author_asc", label: "Author A–Z" },
  { mode: "author_desc", label: "Author Z–A" },
  { mode: "added_newest", label: "Date Added (newest)" },
  { mode: "added_oldest", label: "Date Added (oldest)" },
];

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Prefer `finished_at`; fall back to `updated_at` for legacy read-shelf rows. */
function finishSortTimestamp(book: {
  finished_at: string | null;
  updated_at?: string | null;
}): number {
  const finished = parseTimestamp(book.finished_at);
  if (finished > 0) return finished;
  return parseTimestamp(book.updated_at);
}

function isDnfBook(book: {
  dnf?: boolean;
  completion_tags?: string[] | null;
}): boolean {
  return (
    Boolean(book.dnf) ||
    (book.completion_tags ?? []).some((tag) => tag.toLowerCase() === "dnf")
  );
}

/** History uses `finished_at` for date sorts — not `updated_at`. */
export function sortHistoryBooks<T extends HistorySortableBook>(
  items: T[],
  mode: HistorySortMode
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
    case "author_desc":
      sorted.sort((a, b) => {
        const authorCmp = compareStrings(
          b.books?.author ?? "",
          a.books?.author ?? ""
        );
        if (authorCmp !== 0) return authorCmp;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
    case "added_oldest":
      sorted.sort((a, b) => {
        const dateCmp = finishSortTimestamp(a) - finishSortTimestamp(b);
        if (dateCmp !== 0) return dateCmp;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
    case "added_newest":
    default:
      sorted.sort((a, b) => {
        const dateCmp = finishSortTimestamp(b) - finishSortTimestamp(a);
        if (dateCmp !== 0) return dateCmp;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
  }

  return sorted;
}

export function filterFinishedHistoryBooks<
  T extends HistorySortableBook & {
    shelf_status?: string;
    dnf?: boolean;
    completion_tags?: string[] | null;
  },
>(books: T[]): T[] {
  return books.filter(
    (book) => book.shelf_status === "read" && !isDnfBook(book)
  );
}

const DEFAULT_RECENTLY_FINISHED_LIMIT = 6;

/** Reading Room overview — finished shelf books, newest finish first. */
export function selectRecentlyFinishedBooks<
  T extends HistorySortableBook & {
    shelf_status?: string;
    dnf?: boolean;
    completion_tags?: string[] | null;
  },
>(books: T[], limit = DEFAULT_RECENTLY_FINISHED_LIMIT): T[] {
  return filterFinishedHistoryBooks(books)
    .sort((a, b) => finishSortTimestamp(b) - finishSortTimestamp(a))
    .slice(0, limit);
}
