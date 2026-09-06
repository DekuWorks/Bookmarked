/**
 * Yearly books-read goal.
 * Count Finished attempts by canonical finish date (completion session_date),
 * never user_books.updated_at, shelf-moves, or Goodreads import.
 * Rereads count as separate attempts when they have their own completion event.
 */

import { parseDateKey } from "./readingStreak";

export const YEARLY_GOAL_MIN = 1;
export const YEARLY_GOAL_MAX = 500;

export type YearlyGoalFinishEvent = {
  userBookId: string;
  readNumber?: number | null;
  /** YYYY-MM-DD from the completion session / finished_at. */
  finishedDate: string | null;
  activityKind?: string | null;
  shelfStatus?: string | null;
  dnf?: boolean | null;
};

export type YearlyGoalStatus = {
  year: number;
  target: number | null;
  completed: number;
  percent: number | null;
  remaining: number | null;
  met: boolean;
};

export function yearFromDateKey(dateKey: string | null | undefined): number | null {
  const parsed = parseDateKey(dateKey ?? null);
  if (!parsed) return null;
  return Number(parsed.slice(0, 4));
}

export function canonicalFinishDateKey(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const dateOnly = parseDateKey(trimmed.slice(0, 10));
  if (dateOnly) return dateOnly;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function finishEventCountsForYear(event: YearlyGoalFinishEvent, year: number): boolean {
  if (event.dnf) return false;
  const kind = event.activityKind?.trim() || "completion";
  if (kind === "import" || kind === "backfill" || kind === "correction") return false;
  if (kind !== "completion") return false;
  const dateKey = canonicalFinishDateKey(event.finishedDate);
  return yearFromDateKey(dateKey) === year;
}

export function countBooksFinishedInYear(
  events: YearlyGoalFinishEvent[],
  year: number
): number {
  const seen = new Set<string>();
  for (const event of events) {
    if (!finishEventCountsForYear(event, year)) continue;
    const attempt = Number(event.readNumber) || 1;
    seen.add(`${event.userBookId}:${attempt}`);
  }
  return seen.size;
}

export function computeYearlyReadingGoal(
  events: YearlyGoalFinishEvent[],
  target: number | null,
  year: number = new Date().getFullYear()
): YearlyGoalStatus {
  const completed = countBooksFinishedInYear(events, year);
  if (target == null || target <= 0) {
    return { year, target: null, completed, percent: null, remaining: null, met: false };
  }
  const percent = Math.min(100, Math.round((completed / target) * 1000) / 10);
  const remaining = Math.max(0, target - completed);
  return { year, target, completed, percent, remaining, met: completed >= target };
}

/** Fallback when only user_books rows exist (no completion sessions yet). */
export function finishedAtCountsForYear(
  book: { shelf_status: string; dnf?: boolean | null; finished_at?: string | null },
  year: number
): boolean {
  if (book.shelf_status !== "read" || book.dnf) return false;
  return yearFromDateKey(canonicalFinishDateKey(book.finished_at)) === year;
}

export function finishEventsFromLibraryBooks(
  books: Array<{
    id: string;
    shelf_status: string;
    dnf?: boolean | null;
    finished_at?: string | null;
  }>,
  existing: YearlyGoalFinishEvent[] = []
): YearlyGoalFinishEvent[] {
  const covered = new Set(
    existing
      .filter((event) => (event.activityKind ?? "completion") === "completion")
      .map((event) => event.userBookId)
  );
  const extras: YearlyGoalFinishEvent[] = [];
  for (const book of books) {
    if (covered.has(book.id)) continue;
    if (book.shelf_status !== "read" || book.dnf || !book.finished_at) continue;
    extras.push({
      userBookId: book.id,
      readNumber: 1,
      finishedDate: canonicalFinishDateKey(book.finished_at),
      activityKind: "completion",
    });
  }
  return [...existing, ...extras];
}
