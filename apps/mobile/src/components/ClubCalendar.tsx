import { Pressable, Text, View } from "react-native";
import type { BookClubEvent } from "../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Props = {
  month: Date;
  events: BookClubEvent[];
  selectedDayKey: string | null;
  onChangeMonth: (next: Date) => void;
  onSelectDay: (dayKey: string) => void;
};

function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ClubCalendar({
  month,
  events,
  selectedDayKey,
  onChangeMonth,
  onSelectDay,
}: Props) {
  const monthStart = startOfMonth(month);
  const today = new Date();
  const leadingBlanks = monthStart.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const eventDays = new Set(
    events.map((event) => dayKey(new Date(event.starts_at)))
  );

  const cells: Array<{ key: string; day: number | null }> = [];
  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push({ key: `blank-${i}`, day: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: `day-${day}`, day });
  }

  const title = monthStart.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <View
      className="rounded-2xl border border-brand-border bg-surface p-3"
      accessibilityRole="summary"
      accessibilityLabel={`Calendar for ${title}`}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => onChangeMonth(addMonths(monthStart, -1))}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary/15 active:opacity-80"
        >
          <Text className="text-base font-semibold text-puce-red">‹</Text>
        </Pressable>
        <Text className="text-base font-semibold text-puce-red">{title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => onChangeMonth(addMonths(monthStart, 1))}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary/15 active:opacity-80"
        >
          <Text className="text-base font-semibold text-puce-red">›</Text>
        </Pressable>
      </View>

      <View className="mb-1 flex-row">
        {WEEKDAYS.map((label) => (
          <View key={label} className="flex-1 items-center py-1">
            <Text className="text-[11px] font-semibold uppercase text-ink-muted">
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((cell) => {
          if (cell.day === null) {
            return <View key={cell.key} className="h-11 w-[14.28%]" />;
          }

          const date = new Date(month.getFullYear(), month.getMonth(), cell.day);
          const key = dayKey(date);
          const hasEvent = eventDays.has(key);
          const selected = selectedDayKey === key;
          const isToday = isSameDay(date, today);

          return (
            <Pressable
              key={cell.key}
              accessibilityRole="button"
              accessibilityLabel={`${date.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}${hasEvent ? ", has events" : ""}`}
              accessibilityState={{ selected }}
              onPress={() => onSelectDay(key)}
              className="h-11 w-[14.28%] items-center justify-center"
            >
              <View
                className={`relative min-h-[36px] min-w-[36px] items-center justify-center rounded-full ${
                  selected ? "bg-puce-red" : isToday ? "bg-primary/20" : ""
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? "text-white" : "text-ink"
                  }`}
                >
                  {cell.day}
                </Text>
                {hasEvent ? (
                  <Text
                    className={`absolute -bottom-0.5 text-[10px] ${
                      selected ? "text-white" : "text-puce-red"
                    }`}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    ✦
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function eventsForDayKey(events: BookClubEvent[], key: string): BookClubEvent[] {
  return events.filter((event) => dayKey(new Date(event.starts_at)) === key);
}

export function monthRangeIso(month: Date): { startIso: string; endIso: string } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}
