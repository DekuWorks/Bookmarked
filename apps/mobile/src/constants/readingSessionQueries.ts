/** React Query keys for Reading Room session sources (Trail / Calendar). */
export const READING_SESSIONS_QUERY_KEY = "reading-sessions" as const;
export const READING_CALENDAR_QUERY_KEY = "reading-calendar" as const;

export function readingSessionsQueryKey(userId: string) {
  return [READING_SESSIONS_QUERY_KEY, userId] as const;
}

export function readingCalendarQueryKey(userId: string, startDate: string, endDate: string) {
  return [READING_CALENDAR_QUERY_KEY, userId, startDate, endDate] as const;
}
