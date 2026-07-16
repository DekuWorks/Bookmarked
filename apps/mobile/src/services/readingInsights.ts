import { supabase } from "./supabase";

const STREAK_EVENT_TYPES = [
  "progress_updated",
  "book_finished",
  "reading_finished",
  "reading_started",
  "review_created",
  "review_updated",
] as const;

export type ReadingStreakInsight = {
  current: number;
  longest: number;
  activeDays: number;
};

function toUtcDateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function addUtcDays(dateKey: string, delta: number): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function daysBetweenUtc(a: string, b: string): number {
  const ms =
    new Date(`${b}T12:00:00.000Z`).getTime() - new Date(`${a}T12:00:00.000Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export function computeReadingStreak(timestamps: string[]): ReadingStreakInsight {
  const dateKeys = new Set(timestamps.map(toUtcDateKey));

  if (dateKeys.size === 0) {
    return { current: 0, longest: 0, activeDays: 0 };
  }

  const sorted = Array.from(dateKeys).sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetweenUtc(sorted[i - 1]!, sorted[i]!);
    if (gap === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (gap > 1) {
      run = 1;
    }
  }

  const today = toUtcDateKey(new Date().toISOString());
  const yesterday = addUtcDays(today, -1);

  let current = 0;
  if (dateKeys.has(today) || dateKeys.has(yesterday)) {
    let cursor = dateKeys.has(today) ? today : yesterday;
    while (dateKeys.has(cursor)) {
      current += 1;
      cursor = addUtcDays(cursor, -1);
    }
  }

  return { current, longest, activeDays: dateKeys.size };
}

export async function fetchReadingStreakTimestamps(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select("created_at")
    .eq("user_id", userId)
    .in("event_type", [...STREAK_EVENT_TYPES])
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []).map((row) => row.created_at as string);
}
