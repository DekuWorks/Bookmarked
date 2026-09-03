/** Shared Reading Room trail tab sorting / filtering — web + mobile. */

import type { HistorySortMode } from "./readingRoomHistory";

export const TRAIL_BOOKS_VIEW_MODES = ["list", "grid"] as const;
export type TrailBooksViewMode = (typeof TRAIL_BOOKS_VIEW_MODES)[number];
export const DEFAULT_TRAIL_BOOKS_VIEW: TrailBooksViewMode = "list";
export const TRAIL_BOOKS_VIEW_STORAGE_KEY = "bookmarked.trail.booksView";

export const TRAIL_BOOKS_VIEW_OPTIONS: { id: TrailBooksViewMode; label: string }[] = [
  { id: "list", label: "List View" },
  { id: "grid", label: "Grid View" },
];

export const TRAIL_COPY = {
  title: "Trail",
  pickBook: "Pick a book to view its session notes.",
  sessionNotes: "Session Notes",
  backToTrail: "← Trail",
  backToSessions: "← Session Notes",
} as const;

export function parseTrailBooksView(value: string | null | undefined): TrailBooksViewMode {
  return value === "grid" ? "grid" : "list";
}

export type TrailSortableSession = {
  created_at: string;
};

export type TrailSortableGroup = {
  bookTitle: string;
  bookAuthor?: string | null;
  sessions: TrailSortableSession[];
};

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function latestSessionTimestamp(group: TrailSortableGroup): number {
  let latest = 0;
  for (const session of group.sessions) {
    const parsed = Date.parse(session.created_at);
    if (Number.isFinite(parsed) && parsed > latest) latest = parsed;
  }
  return latest;
}

export function filterTrailBookGroupsByQuery<T extends TrailSortableGroup>(
  groups: readonly T[],
  query: string
): T[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [...groups];
  return groups.filter(
    (group) =>
      group.bookTitle.toLowerCase().includes(trimmed) ||
      (group.bookAuthor ?? "").toLowerCase().includes(trimmed)
  );
}

export function sortTrailBookGroups<T extends TrailSortableGroup>(
  groups: readonly T[],
  mode: HistorySortMode
): T[] {
  const sorted = [...groups];

  switch (mode) {
    case "title_asc":
      sorted.sort((a, b) => compareStrings(a.bookTitle, b.bookTitle));
      break;
    case "title_desc":
      sorted.sort((a, b) => compareStrings(b.bookTitle, a.bookTitle));
      break;
    case "author_asc":
      sorted.sort((a, b) => {
        const authorCmp = compareStrings(a.bookAuthor ?? "", b.bookAuthor ?? "");
        if (authorCmp !== 0) return authorCmp;
        return compareStrings(a.bookTitle, b.bookTitle);
      });
      break;
    case "author_desc":
      sorted.sort((a, b) => {
        const authorCmp = compareStrings(b.bookAuthor ?? "", a.bookAuthor ?? "");
        if (authorCmp !== 0) return authorCmp;
        return compareStrings(a.bookTitle, b.bookTitle);
      });
      break;
    case "added_oldest":
      sorted.sort((a, b) => {
        const dateCmp = latestSessionTimestamp(a) - latestSessionTimestamp(b);
        if (dateCmp !== 0) return dateCmp;
        return compareStrings(a.bookTitle, b.bookTitle);
      });
      break;
    case "added_newest":
    default:
      sorted.sort((a, b) => {
        const dateCmp = latestSessionTimestamp(b) - latestSessionTimestamp(a);
        if (dateCmp !== 0) return dateCmp;
        return compareStrings(a.bookTitle, b.bookTitle);
      });
      break;
  }

  return sorted;
}
