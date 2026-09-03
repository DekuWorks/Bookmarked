/**
 * Shared Notes tab book filter — web + native iOS.
 *
 * Filter key is `user_book_id` (the reader's book relationship). Catalog
 * `book_id` is accepted only as a deep-link alias when it maps to exactly
 * one noted user-book. Titles are never used as database keys.
 *
 * Sort: All Books keeps newest → oldest (existing Notes convention).
 * A selected book uses oldest → newest so that book's trail reads in order.
 */

import { HOME_NOTES_PREVIEW_LIMIT } from "./noteLocation";

export const NOTES_BOOK_QUERY_PARAM = "book";

export const NOTES_BOOK_SEARCH_THRESHOLD = 8;

export const NOTES_BOOK_FILTER_COPY = {
  label: "Filter by Book",
  allBooks: "All Books",
  searchLabel: "Search books",
  searchPlaceholder: "Search by title or author",
  emptyAll: "You haven't saved any notes yet.",
  emptyBook: "No notes saved for this book yet.",
  error: "Couldn't load your notes. Please try again.",
  retry: "Retry",
  advancedFilters: "Advanced filters",
  pageNumber: "Page number",
} as const;

export type NotesBookFilterNote = {
  id: string;
  user_book_id: string;
  created_at: string;
  book?: {
    id: string;
    title: string;
    author?: string | null;
    cover_url?: string | null;
  } | null;
};

export type NotesBookFilterOption = {
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  noteCount: number;
};

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function parseCreatedAt(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseNotesBookQueryParam(
  value: string | null | undefined
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve a `book=` query / deep-link value to a user-book id.
 * Matches `userBookId` first. Catalog `bookId` matches only when unique
 * so editions on different user-book rows are not mixed.
 */
export function matchNotesBookFilter(
  param: string | null | undefined,
  options: readonly NotesBookFilterOption[]
): string | null {
  const value = parseNotesBookQueryParam(param);
  if (!value) return null;

  if (options.some((option) => option.userBookId === value)) {
    return value;
  }

  const byCatalogId = options.filter((option) => option.bookId === value);
  if (byCatalogId.length === 1) {
    return byCatalogId[0].userBookId;
  }

  return null;
}

export function buildNotesBookFilterOptions(
  notes: readonly NotesBookFilterNote[]
): NotesBookFilterOption[] {
  const grouped = new Map<
    string,
    { option: NotesBookFilterOption }
  >();

  for (const note of notes) {
    const userBookId = note.user_book_id;
    if (!userBookId) continue;

    const existing = grouped.get(userBookId);
    if (existing) {
      existing.option.noteCount += 1;
      continue;
    }

    grouped.set(userBookId, {
      option: {
        userBookId,
        bookId: note.book?.id ?? "",
        title: note.book?.title?.trim() || "Untitled",
        author: note.book?.author?.trim() || null,
        coverUrl: note.book?.cover_url ?? null,
        noteCount: 1,
      },
    });
  }

  return [...grouped.values()]
    .map((entry) => entry.option)
    .sort((a, b) => {
      const titleCmp = compareStrings(a.title, b.title);
      if (titleCmp !== 0) return titleCmp;
      return compareStrings(a.author ?? "", b.author ?? "");
    });
}

export function filterNotesBookOptionsByQuery(
  options: readonly NotesBookFilterOption[],
  query: string
): NotesBookFilterOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...options];
  return options.filter((option) => {
    const title = option.title.toLowerCase();
    const author = (option.author ?? "").toLowerCase();
    return title.includes(needle) || author.includes(needle);
  });
}

export function filterNotesByUserBookId<T extends { user_book_id: string }>(
  notes: readonly T[],
  userBookId: string | null
): T[] {
  if (!userBookId) return [...notes];
  return notes.filter((note) => note.user_book_id === userBookId);
}

/** All Books: newest first. Selected book: oldest first. */
export function sortNotesForBookFilter<T extends { created_at: string }>(
  notes: readonly T[],
  selectedUserBookId: string | null
): T[] {
  const sorted = [...notes];
  sorted.sort((a, b) => {
    const delta = parseCreatedAt(a.created_at) - parseCreatedAt(b.created_at);
    if (delta !== 0) {
      return selectedUserBookId ? delta : -delta;
    }
    return 0;
  });
  return sorted;
}

export function selectNotesForBookFilter<
  T extends { user_book_id: string; created_at: string },
>(
  notes: readonly T[],
  selectedUserBookId: string | null,
  previewLimit = HOME_NOTES_PREVIEW_LIMIT
): T[] {
  const filtered = filterNotesByUserBookId(notes, selectedUserBookId);
  const sorted = sortNotesForBookFilter(filtered, selectedUserBookId);
  if (!selectedUserBookId && previewLimit > 0) {
    return sorted.slice(0, previewLimit);
  }
  return sorted;
}

export function notesBookFilterLabel(
  selectedUserBookId: string | null,
  options: readonly NotesBookFilterOption[]
): string {
  if (!selectedUserBookId) return NOTES_BOOK_FILTER_COPY.allBooks;
  const selected = options.find((option) => option.userBookId === selectedUserBookId);
  return selected?.title ?? NOTES_BOOK_FILTER_COPY.allBooks;
}

export function formatNotesBookCount(count: number): string {
  return count === 1 ? "1 note" : `${count} notes`;
}

export function notesEmptyMessage(selectedUserBookId: string | null): string {
  return selectedUserBookId
    ? NOTES_BOOK_FILTER_COPY.emptyBook
    : NOTES_BOOK_FILTER_COPY.emptyAll;
}
