import {
  getReadingPagesByDay,
  getReadingStatsInRange,
  type ReadingPagesByDay,
  type ReadingStatsInRange,
} from "./readingSessions";

export type ReadingActivityData = {
  stats: ReadingStatsInRange;
  pagesByDay: ReadingPagesByDay[];
  weekLabels: string[];
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Last 7 UTC days including today. */
export function getLastWeekRange(): { start: Date; end: Date } {
  const end = addUtcDays(startOfUtcDay(new Date()), 1);
  const start = addUtcDays(end, -7);
  return { start, end };
}

/** Last 12 weeks for heatmap (84 days). */
export function getHeatmapRange(): { start: Date; end: Date } {
  const end = addUtcDays(startOfUtcDay(new Date()), 1);
  const start = addUtcDays(end, -84);
  return { start, end };
}

function shortWeekdayLabel(isoDay: string): string {
  const date = new Date(`${isoDay}T12:00:00.000Z`);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

/** Mirrors apps/web/src/lib/services/readingActivity.ts */
export async function getReadingActivityData(userId: string): Promise<ReadingActivityData> {
  const { start, end } = getLastWeekRange();

  const [stats, pagesByDay] = await Promise.all([
    getReadingStatsInRange(userId, start, end),
    getReadingPagesByDay(userId, start, end),
  ]);

  const byDay = new Map(pagesByDay.map((row) => [row.day, row]));

  const filled: ReadingPagesByDay[] = [];
  const weekLabels: string[] = [];

  for (let i = 0; i < 7; i++) {
    const day = addUtcDays(start, i);
    const key = isoDayKey(day);
    weekLabels.push(shortWeekdayLabel(key));
    filled.push(byDay.get(key) ?? { day: key, pages_read: 0, session_count: 0 });
  }

  return {
    stats: stats ?? { total_pages: 0, session_count: 0, active_days: 0 },
    pagesByDay: filled,
    weekLabels,
  };
}

export async function getReadingHeatmapData(userId: string): Promise<ReadingPagesByDay[]> {
  const { start, end } = getHeatmapRange();
  const pagesByDay = await getReadingPagesByDay(userId, start, end);
  const byDay = new Map(pagesByDay.map((row) => [row.day, row]));

  const filled: ReadingPagesByDay[] = [];
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);

  for (let i = 0; i < days; i++) {
    const day = addUtcDays(start, i);
    const key = isoDayKey(day);
    filled.push(byDay.get(key) ?? { day: key, pages_read: 0, session_count: 0 });
  }

  return filled;
}
