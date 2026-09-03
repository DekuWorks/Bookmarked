/** Home Notes: five recently read books that have notes, one latest note each. */

export const HOME_RECENT_NOTED_BOOKS_LIMIT = 5;

export type RecentNotedBookInput = {
  userBookId: string;
  lastReadAt: string | null;
  updatedAt: string | null;
};

export type RecentNoteCandidate = {
  id: string;
  user_book_id: string;
  created_at: string;
};

export function recentReadTimestamp(book: RecentNotedBookInput): number {
  const raw = book.lastReadAt ?? book.updatedAt;
  if (!raw) return 0;
  const time = Date.parse(raw);
  return Number.isFinite(time) ? time : 0;
}

export function selectRecentNotedBooks<T extends RecentNotedBookInput>(
  books: T[],
  limit = HOME_RECENT_NOTED_BOOKS_LIMIT
): T[] {
  return [...books]
    .sort((a, b) => recentReadTimestamp(b) - recentReadTimestamp(a))
    .slice(0, Math.max(0, limit));
}

/** Keep the newest note per book, preserving first-seen order of `bookIds`. */
export function pickLatestNotePerBook<T extends RecentNoteCandidate>(
  notes: T[],
  bookIds: string[]
): Map<string, T> {
  const latest = new Map<string, T>();
  for (const note of notes) {
    const current = latest.get(note.user_book_id);
    if (!current || Date.parse(note.created_at) > Date.parse(current.created_at)) {
      latest.set(note.user_book_id, note);
    }
  }

  const ordered = new Map<string, T>();
  for (const id of bookIds) {
    const note = latest.get(id);
    if (note) ordered.set(id, note);
  }
  return ordered;
}

export const HOME_RECENT_NOTES_COPY = {
  title: "Recent Notes",
  subtitle: "One latest note from each of your five most recently read books.",
  empty: "Notes from books you are reading will appear here.",
} as const;
