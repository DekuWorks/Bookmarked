/**
 * Basic Reading Calendar — Bookmarked-branded month grid.
 * Qualifying days use the same rules as the reading streak:
 * session_date (or qualifying progress event date), never created_at alone,
 * and never shelf-moves / imports / reviews / ratings.
 *
 * Multi-book same day: most-recent qualifying cover + extra-book count.
 */

import {
  sessionQualifiesForStreak,
  streakDateKeyForSession,
  type StreakSessionInput,
} from "./readingStreak";

export const READING_CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const READING_CALENDAR_COPY = {
  title: "Reading calendar",
  subtitle: "Covers mark days you actually read — sessions and progress, not shelf moves.",
  emptyMonth: "No reading sessions this month yet.",
  multiBook: (count: number) => `${count} books`,
} as const;

export type CalendarSessionInput = StreakSessionInput & {
  bookId?: string | null;
  bookTitle?: string | null;
  bookCoverUrl?: string | null;
};

export type CalendarDayBook = {
  bookId: string | null;
  title: string | null;
  coverUrl: string | null;
};

export type CalendarDay = {
  dateKey: string;
  dayOfMonth: number;
  inMonth: boolean;
  qualifying: boolean;
  /** Most recent qualifying cover for that day. */
  coverUrl: string | null;
  coverTitle: string | null;
  bookCount: number;
  books: CalendarDayBook[];
};

export type ReadingCalendarMonth = {
  year: number;
  month: number;
  label: string;
  weekdayLabels: readonly string[];
  days: CalendarDay[];
};

export type CalendarMonthCursor = { year: number; month: number };

export function addCalendarMonths(cursor: CalendarMonthCursor, delta: number): CalendarMonthCursor {
  const date = new Date(cursor.year, cursor.month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function calendarMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function mondayFirstWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function buildReadingCalendarMonth(
  sessions: CalendarSessionInput[],
  year: number,
  month: number,
  timeZone?: string
): ReadingCalendarMonth {
  const byDay = new Map<
    string,
    { books: Map<string, CalendarDayBook>; latestCover: CalendarDayBook | null; latestAt: number }
  >();

  for (const session of sessions) {
    if (!sessionQualifiesForStreak(session)) continue;
    const key = streakDateKeyForSession(session, timeZone);
    if (!key) continue;

    const bookId = session.bookId ?? null;
    const bookKey = bookId ?? `unknown:${session.bookTitle ?? "book"}`;
    const stamp = session.created_at ? Date.parse(session.created_at) : 0;
    const book: CalendarDayBook = {
      bookId,
      title: session.bookTitle ?? null,
      coverUrl: session.bookCoverUrl ?? null,
    };

    const existing = byDay.get(key) ?? {
      books: new Map<string, CalendarDayBook>(),
      latestCover: null,
      latestAt: Number.NEGATIVE_INFINITY,
    };
    existing.books.set(bookKey, book);
    if (stamp >= existing.latestAt && book.coverUrl) {
      existing.latestCover = book;
      existing.latestAt = stamp;
    } else if (!existing.latestCover && book.coverUrl) {
      existing.latestCover = book;
      existing.latestAt = stamp;
    }
    byDay.set(key, existing);
  }

  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leading = mondayFirstWeekday(first);
  const cells: CalendarDay[] = [];

  for (let i = 0; i < leading; i++) {
    const pad = new Date(year, month - 1, 1 - (leading - i));
    cells.push({
      dateKey: dateKey(pad.getFullYear(), pad.getMonth() + 1, pad.getDate()),
      dayOfMonth: pad.getDate(),
      inMonth: false,
      qualifying: false,
      coverUrl: null,
      coverTitle: null,
      bookCount: 0,
      books: [],
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(year, month, day);
    const entry = byDay.get(key);
    const books = entry ? [...entry.books.values()] : [];
    cells.push({
      dateKey: key,
      dayOfMonth: day,
      inMonth: true,
      qualifying: books.length > 0,
      coverUrl: entry?.latestCover?.coverUrl ?? books[0]?.coverUrl ?? null,
      coverTitle: entry?.latestCover?.title ?? books[0]?.title ?? null,
      bookCount: books.length,
      books,
    });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!;
    const next = new Date(`${last.dateKey}T12:00:00`);
    next.setDate(next.getDate() + 1);
    cells.push({
      dateKey: dateKey(next.getFullYear(), next.getMonth() + 1, next.getDate()),
      dayOfMonth: next.getDate(),
      inMonth: false,
      qualifying: false,
      coverUrl: null,
      coverTitle: null,
      bookCount: 0,
      books: [],
    });
  }

  return {
    year,
    month,
    label: calendarMonthLabel(year, month),
    weekdayLabels: READING_CALENDAR_WEEKDAYS,
    days: cells,
  };
}
