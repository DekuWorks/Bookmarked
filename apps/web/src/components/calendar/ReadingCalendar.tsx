"use client";

import { useEffect, useMemo, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/Button";
import { StatsSectionSkeleton } from "@/components/reading-room/StatsSectionSkeleton";
import { listSessionsForCalendar } from "@/lib/services/readingSessions";
import { cn } from "@/lib/utils/cn";
import {
  READING_CALENDAR_COPY,
  addCalendarMonths,
  buildReadingCalendarMonth,
} from "@bookmarked/utils/readingCalendar";

type Props = {
  userId: string;
};

export function ReadingCalendar({ userId }: Props) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof listSessionsForCalendar>> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const startDate = `${cursor.year}-${String(cursor.month).padStart(2, "0")}-01`;
  const endDate = `${addCalendarMonths(cursor, 1).year}-${String(addCalendarMonths(cursor, 1).month).padStart(2, "0")}-01`;

  useEffect(() => {
    let cancelled = false;
    setSessions(null);
    setError(null);
    void listSessionsForCalendar(userId, startDate, endDate).then((rows) => {
      if (cancelled) return;
      setSessions(rows);
    }).catch((err) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "Could not load the calendar.");
      setSessions([]);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, startDate, endDate]);

  const month = useMemo(
    () => buildReadingCalendarMonth(sessions ?? [], cursor.year, cursor.month),
    [sessions, cursor]
  );

  return (
    <section aria-labelledby="reading-calendar-heading" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id="reading-calendar-heading" className="font-display text-xl text-puce-red">
            {READING_CALENDAR_COPY.title}
          </h3>
          <p className="mt-1 text-sm text-text-muted">{READING_CALENDAR_COPY.subtitle}</p>
        </div>
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCursor((current) => addCalendarMonths(current, -1))}
            aria-label="Previous month"
          >
            Previous
          </Button>
          <p className="truncate text-center text-sm font-semibold text-puce-red" aria-live="polite">
            {month.label}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCursor((current) => addCalendarMonths(current, 1))}
            aria-label="Next month"
          >
            Next
          </Button>
        </div>
      </div>

      {sessions === null ? (
        <StatsSectionSkeleton label="Loading reading calendar" />
      ) : error ? (
        <p className="text-sm text-text-muted" role="alert">
          {error}
        </p>
      ) : (
        <div
          key={`${cursor.year}-${cursor.month}`}
          className="rr-calendar-month min-w-0 max-w-full"
          role="grid"
          aria-label={`${month.label} reading calendar`}
        >
          <div className="grid w-full grid-cols-7 gap-1">
            {month.weekdayLabels.map((label) => (
              <div
                key={label}
                className="truncate px-0.5 py-1 text-center text-[10px] font-semibold uppercase text-text-muted sm:text-xs"
              >
                {label}
              </div>
            ))}
            {month.days.map((day) => (
              <div
                key={day.dateKey}
                role="gridcell"
                aria-label={
                  day.qualifying
                    ? `${day.dateKey}: ${day.coverTitle ?? "reading session"}${
                        day.bookCount > 1 ? `, ${day.bookCount} books` : ""
                      }`
                    : day.dateKey
                }
                className={cn(
                  "min-h-16 min-w-0 rounded-lg border p-0.5 sm:min-h-[4.5rem] sm:p-1",
                  day.inMonth ? "border-border bg-surface" : "border-transparent bg-transparent opacity-40",
                  day.qualifying ? "border-primary/40" : ""
                )}
              >
                <p className="text-[11px] font-medium text-text-muted">{day.dayOfMonth}</p>
                {day.qualifying ? (
                  <div className="mt-1 flex flex-col items-center gap-1">
                    {day.coverUrl ? (
                      <BookCover
                        coverUrl={day.coverUrl}
                        title={day.coverTitle ?? "Book"}
                        className="h-10 w-7"
                      />
                    ) : (
                      <span className="block h-10 w-7 rounded-sm bg-primary/20" aria-hidden />
                    )}
                    {day.bookCount > 1 ? (
                      <span className="text-[10px] font-semibold text-puce-red">
                        +{day.bookCount - 1}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {!month.days.some((day) => day.inMonth && day.qualifying) ? (
            <p className="mt-3 text-center text-sm text-text-muted">
              {READING_CALENDAR_COPY.emptyMonth}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
