/** Canonical usage counter keys (server-managed via `usage_counters` + RPCs). */
export const USAGE_COUNTER_KEYS = {
  quoteGraphics: "quote_graphics",
  readingChallenges: "reading_challenges",
} as const;

export type UsageCounterKey = (typeof USAGE_COUNTER_KEYS)[keyof typeof USAGE_COUNTER_KEYS];

/** Calendar month period, e.g. `2026-08`. */
export function monthPeriodKey(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Calendar year period, e.g. `2026`. */
export function yearPeriodKey(date: Date = new Date()): string {
  return String(date.getUTCFullYear());
}

export function periodKeyForCounter(
  counterKey: UsageCounterKey,
  date: Date = new Date()
): string {
  if (counterKey === USAGE_COUNTER_KEYS.quoteGraphics) return monthPeriodKey(date);
  if (counterKey === USAGE_COUNTER_KEYS.readingChallenges) return yearPeriodKey(date);
  return monthPeriodKey(date);
}
