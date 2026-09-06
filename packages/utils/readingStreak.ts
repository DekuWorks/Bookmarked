/** Streak days come from real reading, dated on the session day — not shelf or import edits. */

export const STREAK_ACTIVITY_KINDS = ["session", "progress"] as const;
export type StreakActivityKind = (typeof STREAK_ACTIVITY_KINDS)[number];

export type ReadingStreakInsight = {
  current: number;
  longest: number;
  activeDays: number;
};

export type StreakSessionInput = {
  session_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  pages_read?: number | null;
  listening_seconds?: number | null;
  listening_end_seconds?: number | null;
  listening_start_seconds?: number | null;
  note?: string | null;
  activity_kind?: string | null;
  completed_at?: string | null;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function localDateKey(date: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (DATE_KEY.test(trimmed)) return trimmed;
  return null;
}

function addDays(dateKey: string, delta: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + delta);
  return localDateKey(date);
}

function daysBetween(a: string, b: string): number {
  const ms =
    new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

function listeningProgress(session: StreakSessionInput): number {
  const explicit = Number(session.listening_seconds) || 0;
  if (explicit > 0) return explicit;
  const start = Number(session.listening_start_seconds) || 0;
  const end = Number(session.listening_end_seconds) || 0;
  return Math.max(0, end - start);
}

export function sessionQualifiesForStreak(session: StreakSessionInput): boolean {
  const kind = session.activity_kind?.trim() || "session";
  if (kind === "import" || kind === "completion" || kind === "backfill" || kind === "correction") {
    return false;
  }
  if (kind !== "session" && kind !== "progress") {
    return false;
  }

  const pages = Number(session.pages_read) || 0;
  const listened = listeningProgress(session);
  if (pages <= 0 && listened <= 0) return false;

  return true;
}

export function streakDateKeyForSession(
  session: StreakSessionInput,
  timeZone?: string
): string | null {
  const sessionDate = parseDateKey(session.session_date);
  if (sessionDate) return sessionDate;
  if (session.created_at) {
    const created = new Date(session.created_at);
    if (!Number.isNaN(created.getTime())) return localDateKey(created, timeZone);
  }
  return null;
}

export function collectStreakDateKeys(
  sessions: StreakSessionInput[],
  timeZone?: string
): string[] {
  const keys = new Set<string>();
  for (const session of sessions) {
    if (!sessionQualifiesForStreak(session)) continue;
    const key = streakDateKeyForSession(session, timeZone);
    if (key) keys.add(key);
  }
  return [...keys];
}

export function computeReadingStreak(
  timestamps: string[],
  now: Date = new Date(),
  timeZone?: string
): ReadingStreakInsight {
  const dateKeys = new Set(
    timestamps
      .map((value) => parseDateKey(value) ?? (value ? localDateKey(new Date(value), timeZone) : null))
      .filter((value): value is string => Boolean(value))
  );

  if (dateKeys.size === 0) {
    return { current: 0, longest: 0, activeDays: 0 };
  }

  const sorted = Array.from(dateKeys).sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1]!, sorted[i]!);
    if (gap === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (gap > 1) {
      run = 1;
    }
  }

  const today = localDateKey(now, timeZone);
  const yesterday = addDays(today, -1);

  let current = 0;
  if (dateKeys.has(today) || dateKeys.has(yesterday)) {
    let cursor = dateKeys.has(today) ? today : yesterday;
    while (dateKeys.has(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  return { current, longest, activeDays: dateKeys.size };
}
