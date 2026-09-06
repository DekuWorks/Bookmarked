/**
 * Monthly Wrapped — Plus only. Opt-in share, not auto-publish, not a Spotify clone.
 */

import { computeReadingStreak, parseDateKey, type StreakSessionInput } from "./readingStreak";
import { type YearlyGoalFinishEvent } from "./yearlyReadingGoal";

export const MONTHLY_WRAPPED_COPY = {
  title: "This month in books",
  subtitle: "A Bookmarked recap of days you actually read this month.",
  shareHint: "Sharing is opt-in. Nothing is posted until you choose Share.",
  emptyMonth: "Not enough reading activity this month for a recap.",
} as const;

export type MonthlyWrappedSession = StreakSessionInput & {
  bookId?: string | null;
  bookTitle?: string | null;
  pages_read?: number | null;
  listening_seconds?: number | null;
  listening_start_seconds?: number | null;
  listening_end_seconds?: number | null;
};

export type MonthlyWrappedRecap = {
  year: number;
  month: number;
  monthLabel: string;
  hasData: boolean;
  booksFinished: number;
  pagesRead: number;
  listeningMinutes: number;
  activeDays: number;
  longestStreak: number;
};

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

function inMonth(dateKey: string | null, year: number, month: number): boolean {
  if (!dateKey) return false;
  return dateKey.startsWith(`${year}-${String(month).padStart(2, "0")}`);
}

export function computeMonthlyWrapped(input: {
  year: number;
  month: number;
  finishEvents: YearlyGoalFinishEvent[];
  sessions: MonthlyWrappedSession[];
}): MonthlyWrappedRecap {
  const { year, month } = input;
  const monthFinishes = input.finishEvents.filter((event) =>
    inMonth(parseDateKey(event.finishedDate?.slice(0, 10) ?? null), year, month)
  ).length;

  let pagesRead = 0;
  let listeningSeconds = 0;
  const dayKeys = new Set<string>();

  for (const session of input.sessions) {
    const kind = session.activity_kind?.trim() || "session";
    if (kind === "import" || kind === "backfill" || kind === "correction") continue;
    const dateKey = parseDateKey(session.session_date) ?? session.created_at?.slice(0, 10) ?? null;
    if (!inMonth(dateKey, year, month) || !dateKey) continue;
    pagesRead += Number(session.pages_read) || 0;
    const listened =
      Number(session.listening_seconds) ||
      Math.max(
        0,
        (Number(session.listening_end_seconds) || 0) - (Number(session.listening_start_seconds) || 0)
      );
    listeningSeconds += listened;
    if (kind === "session" || kind === "progress" || kind === "completion") {
      dayKeys.add(dateKey);
    }
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const streak = computeReadingStreak(
    [...dayKeys],
    new Date(`${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T12:00:00`)
  );

  return {
    year,
    month,
    monthLabel: monthLabel(year, month),
    hasData: monthFinishes > 0 || dayKeys.size > 0 || pagesRead > 0 || listeningSeconds > 0,
    booksFinished: monthFinishes,
    pagesRead,
    listeningMinutes: Math.round(listeningSeconds / 60),
    activeDays: dayKeys.size,
    longestStreak: streak.longest,
  };
}

export function availableWrappedMonths(
  sessions: MonthlyWrappedSession[],
  finishEvents: YearlyGoalFinishEvent[],
  now = new Date()
): Array<{ year: number; month: number }> {
  const keys = new Set<string>();
  for (const session of sessions) {
    const dateKey = parseDateKey(session.session_date) ?? session.created_at?.slice(0, 10) ?? null;
    if (dateKey) keys.add(dateKey.slice(0, 7));
  }
  for (const event of finishEvents) {
    const dateKey = parseDateKey(event.finishedDate?.slice(0, 10) ?? null);
    if (dateKey) keys.add(dateKey.slice(0, 7));
  }
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return [...keys]
    .filter((key) => key <= current)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((key) => ({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) }));
}
