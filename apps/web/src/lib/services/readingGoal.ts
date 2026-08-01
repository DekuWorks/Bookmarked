import type { LibraryBookRow } from "@/lib/services/library";
import { countsTowardFinishedStats } from "../../../../../packages/utils/shelfStatus";

export type ReadingGoalStatus = {
  year: number;
  target: number | null;
  completed: number;
  percent: number | null;
  remaining: number | null;
  met: boolean;
};

export function countBooksReadInYear(
  books: LibraryBookRow[],
  year: number = new Date().getFullYear()
): number {
  return books.filter((ub) => isBookCountedForYear(ub, year)).length;
}

function isBookCountedForYear(ub: LibraryBookRow, year: number): boolean {
  // DNF never counts toward reading goals.
  if (!countsTowardFinishedStats(ub)) return false;
  const dateStr = ub.finished_at ?? ub.updated_at;
  if (!dateStr) return false;
  return new Date(dateStr).getFullYear() === year;
}

export function computeReadingGoal(
  books: LibraryBookRow[],
  target: number | null,
  year: number = new Date().getFullYear()
): ReadingGoalStatus {
  const completed = countBooksReadInYear(books, year);

  if (target == null || target <= 0) {
    return {
      year,
      target: null,
      completed,
      percent: null,
      remaining: null,
      met: false,
    };
  }

  const percent = Math.min(100, Math.round((completed / target) * 1000) / 10);
  const remaining = Math.max(0, target - completed);

  return {
    year,
    target,
    completed,
    percent,
    remaining,
    met: completed >= target,
  };
}
