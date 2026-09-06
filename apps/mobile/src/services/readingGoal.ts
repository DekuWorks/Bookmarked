import type { LibraryBookRow } from "./library";
import { countsTowardFinishedStats } from "../../../../packages/utils/shelfStatus";

/** Pure reading-goal computation — mirrors apps/web/src/lib/services/readingGoal.ts. */

export type ReadingGoalStatus = {
  year: number;
  target: number | null;
  completed: number;
  percent: number | null;
  remaining: number | null;
  met: boolean;
};

function isBookCountedForYear(ub: LibraryBookRow, year: number): boolean {
  // DNF never counts. Use canonical finished_at only — never updated_at.
  if (!countsTowardFinishedStats(ub)) return false;
  const dateStr = ub.finished_at;
  if (!dateStr) return false;
  return new Date(dateStr).getFullYear() === year;
}

export function countBooksReadInYear(
  books: LibraryBookRow[],
  year: number = new Date().getFullYear()
): number {
  return books.filter((ub) => isBookCountedForYear(ub, year)).length;
}

export function computeReadingGoal(
  books: LibraryBookRow[],
  target: number | null,
  year: number = new Date().getFullYear()
): ReadingGoalStatus {
  const completed = countBooksReadInYear(books, year);

  if (target == null || target <= 0) {
    return { year, target: null, completed, percent: null, remaining: null, met: false };
  }

  const percent = Math.min(100, Math.round((completed / target) * 1000) / 10);
  const remaining = Math.max(0, target - completed);
  return { year, target, completed, percent, remaining, met: completed >= target };
}
