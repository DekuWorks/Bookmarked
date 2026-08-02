"use client";

import { useMemo } from "react";
import type { BookClubEvent } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  month: Date;
  events: BookClubEvent[];
  selectedDayKey: string | null;
  onSelectDay: (dayKey: string, dayEvents: BookClubEvent[]) => void;
  onChangeMonth: (next: Date) => void;
};

/** Brand 4-point sparkle glyph (static — for calendar event days). */
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        d="M12 0.5L14.2 9.3L23.5 12L14.2 14.7L12 23.5L9.8 14.7L0.5 12L9.8 9.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function dayKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayKeyFromIso(iso: string): string {
  const date = new Date(iso);
  return dayKeyFromDate(date);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function ClubCalendar({
  month,
  events,
  selectedDayKey,
  onSelectDay,
  onChangeMonth,
}: Props) {
  const todayKey = dayKeyFromDate(new Date());

  const eventsByDay = useMemo(() => {
    const map = new Map<string, BookClubEvent[]>();
    for (const event of events) {
      const key = dayKeyFromIso(event.starts_at);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const first = new Date(year, monthIndex, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
    const result: Array<{ key: string; day: number | null; inMonth: boolean }> = [];

    for (let i = 0; i < total; i += 1) {
      const dayNum = i - startPad + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        result.push({ key: `pad-${i}`, day: null, inMonth: false });
      } else {
        const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        result.push({ key, day: dayNum, inMonth: true });
      }
    }
    return result;
  }, [month]);

  const label = month.toLocaleString(undefined, { month: "long", year: "numeric" });

  function shiftMonth(delta: number) {
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-lg px-2 py-1 text-sm text-text-muted hover:bg-background hover:text-primary"
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="text-sm font-semibold text-puce-red" id="club-calendar-label">
          {label}
        </h3>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-lg px-2 py-1 text-sm text-text-muted hover:bg-background hover:text-primary"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div
        role="grid"
        aria-labelledby="club-calendar-label"
        className="grid grid-cols-7 gap-1"
      >
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-text-muted"
          >
            {day}
          </div>
        ))}

        {cells.map((cell) => {
          if (!cell.inMonth || cell.day === null) {
            return <div key={cell.key} role="gridcell" className="min-h-10" />;
          }

          const dayEvents = eventsByDay.get(cell.key) ?? [];
          const hasEvents = dayEvents.length > 0;
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedDayKey;

          return (
            <button
              key={cell.key}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${cell.day}${hasEvents ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`}
              onClick={() => onSelectDay(cell.key, dayEvents)}
              className={cn(
                "relative flex min-h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors",
                isSelected
                  ? "bg-puce-red text-white"
                  : isToday
                    ? "bg-primary/15 font-semibold text-puce-red"
                    : "text-text hover:bg-background",
                hasEvents && !isSelected ? "font-medium" : null
              )}
            >
              <span>{cell.day}</span>
              {hasEvents ? (
                <SparkleIcon
                  className={cn(
                    "absolute bottom-0.5 h-2.5 w-2.5",
                    isSelected ? "text-white/90" : "text-royal-orange"
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { dayKeyFromDate, dayKeyFromIso };
