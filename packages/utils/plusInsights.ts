/**
 * Plus reading insights — computed from real session fields only.
 * Never invent pages/hour from start/finish dates.
 * Never treat audiobook listening as pages.
 * Reading time and listening time stay separate.
 */

import { parseDateKey } from "./readingStreak";

export const PLUS_INSIGHTS_COPY = {
  sparseHabits:
    "Not enough recent sessions to describe a habit yet. Keep logging progress — we will not invent a pattern.",
  noSpeed:
    "Pages per hour appears only when a print session has both pages and a timed duration. We never guess from start or finish dates.",
  noAudiobookSpeed: "Audiobooks do not have a pages-per-hour pace.",
  incompleteYear: "This year is still in progress, so it is omitted from year-over-year change.",
  heatmapMetric: "Pages read",
  heatmapHint: "Darker royal orange means more pages that day. Listening time is tracked separately.",
} as const;

export type PlusInsightSession = {
  session_date?: string | null;
  created_at?: string | null;
  pages_read?: number | null;
  duration_seconds?: number | null;
  listening_seconds?: number | null;
  listening_start_seconds?: number | null;
  listening_end_seconds?: number | null;
  session_format?: string | null;
  activity_kind?: string | null;
  mood?: string | null;
  bookAuthor?: string | null;
};

export type PagesByBucket = {
  key: string;
  label: string;
  pages: number;
  sessionCount: number;
};

export type ReadingSpeedInsight = {
  pagesPerHour: number | null;
  timedPages: number;
  timedSeconds: number;
  omittedAudiobookSessions: number;
  omittedUntimedPrintSessions: number;
};

export type ReadingTimeInsight = {
  readingSeconds: number;
  listeningSeconds: number;
  combinedSeconds: number | null;
};

export type YearOverYearPoint = {
  year: number;
  pages: number;
  listeningSeconds: number;
  booksFinished: number;
  complete: boolean;
  percentChangePages: number | null;
};

function sessionDateKey(session: PlusInsightSession): string | null {
  return parseDateKey(session.session_date) ?? parseDateKey(session.created_at?.slice(0, 10) ?? null);
}

function isCountableKind(kind?: string | null): boolean {
  const value = kind?.trim() || "session";
  return value === "session" || value === "progress";
}

function isAudiobook(session: PlusInsightSession): boolean {
  return session.session_format === "audiobook";
}

function listeningSecondsOf(session: PlusInsightSession): number {
  const explicit = Number(session.listening_seconds) || 0;
  if (explicit > 0) return explicit;
  const start = Number(session.listening_start_seconds) || 0;
  const end = Number(session.listening_end_seconds) || 0;
  return Math.max(0, end - start);
}

function printDurationSeconds(session: PlusInsightSession): number {
  if (isAudiobook(session)) return 0;
  return Math.max(0, Number(session.duration_seconds) || 0);
}

function printPages(session: PlusInsightSession): number {
  if (isAudiobook(session)) return 0;
  return Math.max(0, Number(session.pages_read) || 0);
}

/** Pages/hour only when print pages and timed duration both exist. */
export function computeReadingSpeed(sessions: PlusInsightSession[]): ReadingSpeedInsight {
  let timedPages = 0;
  let timedSeconds = 0;
  let omittedAudiobookSessions = 0;
  let omittedUntimedPrintSessions = 0;

  for (const session of sessions) {
    if (!isCountableKind(session.activity_kind)) continue;
    if (isAudiobook(session)) {
      omittedAudiobookSessions += 1;
      continue;
    }
    const pages = printPages(session);
    const duration = printDurationSeconds(session);
    if (pages > 0 && duration > 0) {
      timedPages += pages;
      timedSeconds += duration;
      continue;
    }
    if (pages > 0 && duration <= 0) omittedUntimedPrintSessions += 1;
  }

  if (timedPages <= 0 || timedSeconds <= 0) {
    return {
      pagesPerHour: null,
      timedPages,
      timedSeconds,
      omittedAudiobookSessions,
      omittedUntimedPrintSessions,
    };
  }

  return {
    pagesPerHour: Number(((timedPages / timedSeconds) * 3600).toFixed(1)),
    timedPages,
    timedSeconds,
    omittedAudiobookSessions,
    omittedUntimedPrintSessions,
  };
}

/**
 * Reading vs listening stay separate. Do not show a combined “Total Reading Time”.
 * `combinedSeconds` stays null unless a caller explicitly asks to combine.
 */
export function computeReadingTime(
  sessions: PlusInsightSession[],
  options?: { combine?: boolean }
): ReadingTimeInsight {
  let readingSeconds = 0;
  let listening = 0;

  for (const session of sessions) {
    if (!isCountableKind(session.activity_kind)) continue;
    readingSeconds += printDurationSeconds(session);
    listening += listeningSecondsOf(session);
  }

  return {
    readingSeconds,
    listeningSeconds: listening,
    combinedSeconds: options?.combine ? readingSeconds + listening : null,
  };
}

export function computePagesByWeek(
  sessions: PlusInsightSession[],
  weekCount = 8,
  now = new Date()
): PagesByBucket[] {
  return computePagesByPeriod(sessions, "week", weekCount, now);
}

export function computePagesByMonth(
  sessions: PlusInsightSession[],
  monthCount = 6,
  now = new Date()
): PagesByBucket[] {
  return computePagesByPeriod(sessions, "month", monthCount, now);
}

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computePagesByPeriod(
  sessions: PlusInsightSession[],
  period: "week" | "month",
  count: number,
  now: Date
): PagesByBucket[] {
  const buckets: PagesByBucket[] = [];
  const end = utcDay(now);

  for (let i = count - 1; i >= 0; i--) {
    if (period === "week") {
      const weekEnd = addUtcDays(end, -7 * i + 1);
      const weekStart = addUtcDays(weekEnd, -7);
      buckets.push({
        key: isoKey(weekStart),
        label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(weekStart),
        pages: 0,
        sessionCount: 0,
      });
      continue;
    }
    const monthDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    buckets.push({
      key: monthDate.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(monthDate),
      pages: 0,
      sessionCount: 0,
    });
  }

  for (const session of sessions) {
    if (!isCountableKind(session.activity_kind)) continue;
    const pages = printPages(session);
    if (pages <= 0) continue;
    const dateKey = sessionDateKey(session);
    if (!dateKey) continue;

    if (period === "week") {
      const match = buckets.find((bucket) => {
        const start = bucket.key;
        const endKey = isoKey(addUtcDays(new Date(`${start}T12:00:00.000Z`), 7));
        return dateKey >= start && dateKey < endKey;
      });
      if (match) {
        match.pages += pages;
        match.sessionCount += 1;
      }
      continue;
    }

    const monthKey = dateKey.slice(0, 7);
    const match = buckets.find((bucket) => bucket.key === monthKey);
    if (match) {
      match.pages += pages;
      match.sessionCount += 1;
    }
  }

  return buckets;
}

export type HabitInsight = {
  busiestWeekday: string | null;
  typicalHourLabel: string | null;
  sparse: boolean;
  copy: string;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function computeReadingHabits(sessions: PlusInsightSession[]): HabitInsight {
  const weekdayCounts = new Array(7).fill(0);
  let countable = 0;

  for (const session of sessions) {
    if (!isCountableKind(session.activity_kind)) continue;
    const dateKey = sessionDateKey(session);
    if (!dateKey) continue;
    if (printPages(session) <= 0 && listeningSecondsOf(session) <= 0 && printDurationSeconds(session) <= 0) {
      continue;
    }
    const day = new Date(`${dateKey}T12:00:00.000Z`).getUTCDay();
    weekdayCounts[day] += 1;
    countable += 1;
  }

  if (countable < 5) {
    return {
      busiestWeekday: null,
      typicalHourLabel: null,
      sparse: true,
      copy: PLUS_INSIGHTS_COPY.sparseHabits,
    };
  }

  let topDay = 0;
  for (let i = 1; i < 7; i++) {
    if (weekdayCounts[i] > weekdayCounts[topDay]) topDay = i;
  }

  return {
    busiestWeekday: WEEKDAYS[topDay] ?? null,
    typicalHourLabel: null,
    sparse: false,
    copy: `Most of your logged sessions land on ${WEEKDAYS[topDay]}. This is a tendency, not a precise schedule.`,
  };
}

export function computeYearOverYear(input: {
  years: Array<{ year: number; pages: number; listeningSeconds: number; booksFinished: number }>;
  currentYear: number;
}): YearOverYearPoint[] {
  const sorted = [...input.years].sort((a, b) => a.year - b.year);
  return sorted.map((row, index) => {
    const complete = row.year < input.currentYear;
    const previous = index > 0 ? sorted[index - 1] : null;
    let percentChangePages: number | null = null;
    if (complete && previous && previous.year === row.year - 1) {
      if (previous.pages === 0 && row.pages === 0) {
        percentChangePages = 0;
      } else if (previous.pages === 0) {
        percentChangePages = null;
      } else {
        percentChangePages = Number((((row.pages - previous.pages) / previous.pages) * 100).toFixed(1));
        if (!Number.isFinite(percentChangePages)) percentChangePages = null;
      }
    }
    return {
      ...row,
      complete,
      percentChangePages: complete ? percentChangePages : null,
    };
  });
}

export type HeatmapDay = {
  day: string;
  value: number;
  label: string;
};

export function heatmapA11yLabel(day: string, pages: number): string {
  const date = new Date(`${day}T12:00:00.000Z`);
  const when = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (pages <= 0) return `${when}: no pages read`;
  return `${when}: ${pages} page${pages === 1 ? "" : "s"} read`;
}

export function toHeatmapDays(days: Array<{ day: string; pages_read: number }>): HeatmapDay[] {
  return days.map((row) => ({
    day: row.day,
    value: Math.max(0, Number(row.pages_read) || 0),
    label: heatmapA11yLabel(row.day, Number(row.pages_read) || 0),
  }));
}
