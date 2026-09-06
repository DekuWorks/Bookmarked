import type { UserReadingSession } from "../services/readingSessions";
import { formatListeningSessionSummary } from "../../../../packages/utils/listeningTime";

/** Mirrors apps/web/src/lib/reading-room/trail.ts for mobile Trail parity. */

export type BookSessionGroup = {
  key: string;
  bookId: string | null;
  bookTitle: string;
  bookAuthor: string | null;
  bookCoverUrl: string | null;
  sessions: UserReadingSession[];
};

export type ReadSessionGroup = {
  readNumber: number;
  sessions: UserReadingSession[];
};

export function groupSessionsByBook(sessions: UserReadingSession[]): BookSessionGroup[] {
  const groups = new Map<string, BookSessionGroup>();

  for (const session of sessions) {
    const key = session.bookId ?? session.bookTitle ?? session.id;
    const existing = groups.get(key);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groups.set(key, {
        key,
        bookId: session.bookId,
        bookTitle: session.bookTitle ?? "Reading session",
        bookAuthor: session.bookAuthor ?? null,
        bookCoverUrl: session.bookCoverUrl ?? null,
        sessions: [session],
      });
    }
  }

  return [...groups.values()].sort((a, b) =>
    a.bookTitle.localeCompare(b.bookTitle, undefined, { sensitivity: "base" })
  );
}

export function groupSessionsByReadNumber(sessions: UserReadingSession[]): ReadSessionGroup[] {
  const groups = new Map<number, UserReadingSession[]>();

  for (const session of sessions) {
    const readNumber = Math.max(1, Number(session.read_number) || 1);
    const list = groups.get(readNumber) ?? [];
    list.push(session);
    groups.set(readNumber, list);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([readNumber, readSessions]) => ({
      readNumber,
      sessions: [...readSessions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }));
}

export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function sessionSummary(session: UserReadingSession): string {
  if (session.session_format === "audiobook") {
    return formatListeningSessionSummary(session);
  }
  if (session.pages_read > 0) {
    if (session.page_start === session.page_end) {
      return `Page ${session.page_end} · ${Math.round(session.percent_complete)}%`;
    }
    return `Pages ${session.page_start}–${session.page_end} · ${session.pages_read} pages`;
  }
  return `${Math.round(session.percent_complete)}% complete`;
}
