/**
 * Yearly Bookmarked recap — Free-tier original, not a Spotify/Fable clone.
 * Only metrics that can be computed from real activity dates.
 * monthly_wrapped (Plus) is a different surface and is not implemented here.
 */

import { computeReadingStreak, parseDateKey, type StreakSessionInput } from "./readingStreak";
import {
  countBooksFinishedInYear,
  yearFromDateKey,
  type YearlyGoalFinishEvent,
} from "./yearlyReadingGoal";

export const YEARLY_WRAPPED_COPY = {
  title: "Your year in books",
  subtitle: "A Bookmarked recap of days you actually read.",
  shareHint: "Sharing is opt-in. Nothing is posted until you choose Share.",
  emptyYear: "Not enough reading activity this year for a recap.",
} as const;

export type WrappedSession = StreakSessionInput & {
  bookId?: string | null;
  bookTitle?: string | null;
};

export type WrappedReview = {
  rating?: number | null;
  createdAt?: string | null;
};

export type YearlyWrappedInput = {
  year: number;
  finishEvents: YearlyGoalFinishEvent[];
  sessions: WrappedSession[];
  reviews?: WrappedReview[];
  quotesSaved?: number;
};

export type YearlyWrappedRecap = {
  year: number;
  hasData: boolean;
  booksFinished: number;
  pagesRead: number;
  listeningMinutes: number;
  activeDays: number;
  longestStreak: number;
  reviewsWritten: number;
  quotesSaved: number;
  mostReadMonth: { month: number; label: string; days: number } | null;
};

function monthLabel(month: number): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long" }).format(new Date(2026, month - 1, 1));
}

function sessionInYear(session: WrappedSession, year: number, timeZone?: string): boolean {
  const key =
    parseDateKey(session.session_date) ??
    (session.created_at ? parseDateKey(session.created_at.slice(0, 10)) : null);
  return yearFromDateKey(key) === year;
}

export function computeYearlyWrapped(
  input: YearlyWrappedInput,
  timeZone?: string
): YearlyWrappedRecap {
  const { year } = input;
  const booksFinished = countBooksFinishedInYear(input.finishEvents, year);
  const yearSessions = input.sessions.filter((session) => sessionInYear(session, year, timeZone));

  let pagesRead = 0;
  let listeningSeconds = 0;
  const dayKeys = new Set<string>();
  const daysByMonth = new Map<number, Set<string>>();

  for (const session of yearSessions) {
    const kind = session.activity_kind?.trim() || "session";
    if (kind === "import" || kind === "backfill" || kind === "correction") continue;
    const dateKey = parseDateKey(session.session_date) ?? session.created_at?.slice(0, 10) ?? null;
    if (!dateKey || yearFromDateKey(dateKey) !== year) continue;

    const pages = Number(session.pages_read) || 0;
    if (pages > 0) pagesRead += pages;
    const listened =
      Number(session.listening_seconds) ||
      Math.max(0, (Number(session.listening_end_seconds) || 0) - (Number(session.listening_start_seconds) || 0));
    if (listened > 0) listeningSeconds += listened;

    if (kind === "session" || kind === "progress" || kind === "completion") {
      dayKeys.add(dateKey);
      const month = Number(dateKey.slice(5, 7));
      const bucket = daysByMonth.get(month) ?? new Set<string>();
      bucket.add(dateKey);
      daysByMonth.set(month, bucket);
    }
  }

  const streak = computeReadingStreak([...dayKeys], new Date(`${year}-12-31T12:00:00`), timeZone);
  let mostReadMonth: YearlyWrappedRecap["mostReadMonth"] = null;
  for (const [month, days] of daysByMonth) {
    if (!mostReadMonth || days.size > mostReadMonth.days) {
      mostReadMonth = { month, label: monthLabel(month), days: days.size };
    }
  }

  const reviewsWritten = (input.reviews ?? []).filter((review) => {
    const created = review.createdAt?.slice(0, 10) ?? null;
    return yearFromDateKey(created) === year;
  }).length;

  const hasData = booksFinished > 0 || dayKeys.size > 0 || pagesRead > 0 || listeningSeconds > 0;

  return {
    year,
    hasData,
    booksFinished,
    pagesRead,
    listeningMinutes: Math.round(listeningSeconds / 60),
    activeDays: dayKeys.size,
    longestStreak: streak.longest,
    reviewsWritten,
    quotesSaved: input.quotesSaved ?? 0,
    mostReadMonth,
  };
}

export function availableWrappedYears(
  finishEvents: YearlyGoalFinishEvent[],
  sessions: WrappedSession[],
  now = new Date()
): number[] {
  const years = new Set<number>();
  for (const event of finishEvents) {
    const year = yearFromDateKey(event.finishedDate?.slice(0, 10) ?? null);
    if (year) years.add(year);
  }
  for (const session of sessions ?? []) {
    const year = yearFromDateKey(session.session_date ?? session.created_at?.slice(0, 10) ?? null);
    if (year) years.add(year);
  }
  const current = now.getFullYear();
  return [...years].filter((year) => year <= current).sort((a, b) => b - a);
}
