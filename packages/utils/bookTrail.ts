/**
 * Book Detail trail: one user-book, newest session first.
 * Shared by web and iOS. Does not load or store sessions.
 */

import { formatListeningSessionSummary } from "./listeningTime";
import { DEFAULT_PAGE_SIZE } from "./pagination";
import { sessionMoodsFromRow } from "./sessionMoods";

export const BOOK_TRAIL_PREVIEW_LIMIT = 5;
export const BOOK_TRAIL_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export type BookTrailPlatform = "web" | "mobile";

export type BookTrailSession = {
  id: string;
  created_at: string;
  session_date?: string | null;
  user_book_id?: string | null;
  note?: string | null;
  mood?: string | null;
  moods?: string[] | null;
  page_start?: number | null;
  page_end?: number | null;
  pages_read?: number | null;
  percent_complete?: number | null;
  session_format?: string | null;
  listening_start_seconds?: number | null;
  listening_end_seconds?: number | null;
  listening_seconds?: number | null;
};

/** Calendar day the session belongs on. A backdated session_date wins over created_at. */
export function bookTrailSessionDay(session: {
  session_date?: string | null;
  created_at: string;
}): string {
  const day = session.session_date?.slice(0, 10) ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const created = Date.parse(session.created_at);
  if (!Number.isFinite(created)) return "";
  return new Date(created).toISOString().slice(0, 10);
}

/**
 * Newest day first, then created_at, then id.
 * Note and mood fields are not part of the key, so editing them does not reorder.
 */
export function compareBookTrailSessionsNewestFirst<
  T extends { id: string; created_at: string; session_date?: string | null },
>(a: T, b: T): number {
  const dayCmp = bookTrailSessionDay(b).localeCompare(bookTrailSessionDay(a));
  if (dayCmp !== 0) return dayCmp;
  const timeA = Date.parse(a.created_at);
  const timeB = Date.parse(b.created_at);
  const safeA = Number.isFinite(timeA) ? timeA : 0;
  const safeB = Number.isFinite(timeB) ? timeB : 0;
  if (safeA !== safeB) return safeB - safeA;
  return b.id.localeCompare(a.id);
}

export function sortBookTrailSessions<
  T extends { id: string; created_at: string; session_date?: string | null },
>(sessions: readonly T[]): T[] {
  return [...sessions].sort(compareBookTrailSessionsNewestFirst);
}

export function filterBookTrailSessions<T extends { user_book_id?: string | null }>(
  sessions: readonly T[],
  userBookId: string
): T[] {
  if (!userBookId) return [];
  return sessions.filter((session) => session.user_book_id === userBookId);
}

export function previewBookTrailSessions<
  T extends { id: string; created_at: string; session_date?: string | null },
>(
  sessions: readonly T[],
  limit = BOOK_TRAIL_PREVIEW_LIMIT
): { sessions: T[]; total: number } {
  const sorted = sortBookTrailSessions(sessions);
  const size = Math.max(0, Math.floor(limit));
  return { sessions: sorted.slice(0, size), total: sorted.length };
}

/** Trail starts closed. Only an explicit trail=open return opens it. */
export function initialBookTrailOpen(trailParam: string | null | undefined): boolean {
  return trailParam === "open";
}

/** A session load must not flip the disclosure. */
export function bookTrailOpenAfterLoad(open: boolean, _sessionCount: number): boolean {
  return open;
}

export function bookTrailPageRange(page: number, pageSize = BOOK_TRAIL_PAGE_SIZE) {
  const size = Math.max(1, Math.floor(pageSize) || BOOK_TRAIL_PAGE_SIZE);
  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * size;
  return { from, to: from + size - 1, page: safePage, pageSize: size };
}

export function bookDetailHref(
  platform: BookTrailPlatform,
  bookId: string,
  options?: { trailOpen?: boolean; section?: string | null; origin?: string | null }
): string {
  const id = encodeURIComponent(bookId);
  const params = new URLSearchParams();
  if (options?.origin) params.set("origin", options.origin);
  if (options?.section) params.set("section", options.section);
  if (options?.trailOpen) params.set("trail", "open");
  if (platform === "web") {
    params.set("id", bookId);
    // Keep id first so the href matches the existing book route.
    const ordered = new URLSearchParams();
    ordered.set("id", bookId);
    if (options?.section) ordered.set("section", options.section);
    if (options?.origin) ordered.set("origin", options.origin);
    if (options?.trailOpen) ordered.set("trail", "open");
    return `/book/?${ordered.toString()}`;
  }
  const qs = params.toString();
  return qs ? `/book/${id}?${qs}` : `/book/${id}`;
}

export function fullBookTrailHref(platform: BookTrailPlatform, bookId: string): string {
  const id = encodeURIComponent(bookId);
  if (platform === "web") return `/book/trail/?id=${id}`;
  return `/book/trail?id=${id}`;
}

/** Back from the full trail opens the same book with the trail disclosure open. */
export function fullTrailBackTarget(
  platform: BookTrailPlatform,
  bookId: string
): { href: string; bookId: string; trailOpen: true } {
  return {
    href: bookDetailHref(platform, bookId, { trailOpen: true }),
    bookId,
    trailOpen: true,
  };
}

export function withTrailOpenHref(href: string): string {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutHash.indexOf("?");
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const params = new URLSearchParams(queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "");
  params.set("trail", "open");
  const qs = params.toString();
  return qs ? `${path}?${qs}${hash}` : `${path}${hash}`;
}

/**
 * Old Reading Room Trail / Journal links.
 * A book id goes to that book's detail with the trail open. Otherwise Overview.
 */
export function legacyTrailLocation(input: {
  tab?: string | null;
  bookId?: string | null;
  platform: BookTrailPlatform;
}): { href: string; bookId: string | null; trailOpen: boolean } | null {
  const tab = input.tab?.trim().toLowerCase();
  if (tab !== "trail" && tab !== "journal") return null;
  const bookId = input.bookId?.trim() || null;
  if (bookId) {
    return {
      href: bookDetailHref(input.platform, bookId, { trailOpen: true, section: "trail" }),
      bookId,
      trailOpen: true,
    };
  }
  return {
    href: input.platform === "web" ? "/reading-room/" : "/",
    bookId: null,
    trailOpen: false,
  };
}

export function visibleTrailNote(note: string | null | undefined): string | null {
  const trimmed = note?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export function visibleTrailMoods(row: { mood?: string | null; moods?: string[] | null }): string[] {
  return sessionMoodsFromRow(row).filter((mood) => mood.trim().length > 0);
}

export function formatBookTrailSessionSummary(
  session: {
    session_format?: string | null;
    page_start?: number | null;
    page_end?: number | null;
    pages_read?: number | null;
    percent_complete?: number | null;
    listening_start_seconds?: number | null;
    listening_end_seconds?: number | null;
    listening_seconds?: number | null;
  },
  options?: { oldest?: boolean }
): string {
  if (session.session_format === "audiobook") {
    return formatListeningSessionSummary(session);
  }

  const pageStart = Number(session.page_start);
  const pageEnd = Number(session.page_end);
  const pagesRead = Number(session.pages_read);
  const percent = Number(session.percent_complete);
  const hasPages = Number.isFinite(pageStart) && Number.isFinite(pageEnd);
  const hasRead = Number.isFinite(pagesRead) && pagesRead > 0;
  const percentText = Number.isFinite(percent) ? `${Math.round(percent)}%` : null;

  if (options?.oldest && hasPages && pageStart === 0 && pageEnd > 0 && percentText) {
    return `Started reading — page ${pageEnd} (${percentText})`;
  }

  if (hasPages && pageEnd >= pageStart && hasRead && percentText) {
    if (pageStart === pageEnd) {
      return `Read page ${pageEnd} (${percentText})`;
    }
    return `Read pages ${pageStart} → ${pageEnd} (${pagesRead} pages, ${percentText})`;
  }

  if (Number.isFinite(percent) && percent >= 100) return "Finished reading";
  if (percentText) return `Progress updated — ${percentText} complete`;
  return "Progress updated";
}

export function bookTrailSessionDisplay(
  session: BookTrailSession,
  options?: { oldest?: boolean }
): { summary: string; note: string | null; moods: string[] } {
  return {
    summary: formatBookTrailSessionSummary(session, options),
    note: visibleTrailNote(session.note),
    moods: visibleTrailMoods(session),
  };
}

export function bookTrailSessionDisplayText(display: {
  summary: string;
  note: string | null;
  moods: readonly string[];
}): string {
  return [display.summary, display.note, ...display.moods].filter((part): part is string => Boolean(part)).join(" ");
}

/** Changes the note on one session. Date, progress, id, and list length stay put. */
export function applyBookTrailNoteEdit<T extends BookTrailSession>(
  sessions: readonly T[],
  sessionId: string,
  note: string
): T[] {
  const nextNote = note.trim() ? note.trim() : null;
  return sessions.map((session) => (session.id === sessionId ? { ...session, note: nextNote } : session));
}
