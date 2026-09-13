import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  READING_CALENDAR_COPY,
  addCalendarMonths,
  buildReadingCalendarMonth,
} from "../../../../packages/utils/readingCalendar";
import { readingCalendarQueryKey } from "../constants/readingSessionQueries";
import { listSessionsForCalendar } from "../services/readingSessions";
import { BookCover } from "./BookCover";
import { LoadingState } from "./LoadingState";
import { useThemeColors } from "../store/themeStore";

type Props = {
  userId: string;
};

export function ReadingCalendar({ userId }: Props) {
  const colors = useThemeColors();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });

  const startDate = `${cursor.year}-${String(cursor.month).padStart(2, "0")}-01`;
  const next = addCalendarMonths(cursor, 1);
  const endDate = `${next.year}-${String(next.month).padStart(2, "0")}-01`;

  const sessionsQuery = useQuery({
    queryKey: readingCalendarQueryKey(userId, startDate, endDate),
    queryFn: () => listSessionsForCalendar(userId, startDate, endDate),
  });

  const month = useMemo(
    () => buildReadingCalendarMonth(sessionsQuery.data ?? [], cursor.year, cursor.month),
    [sessionsQuery.data, cursor]
  );

  const showLoading = sessionsQuery.isLoading && !sessionsQuery.data;

  return (
    <View className="gap-3">
      <View>
        <Text className="text-base font-semibold" style={{ color: colors.puceRed }}>
          {READING_CALENDAR_COPY.title}
        </Text>
        <Text className="mt-1 text-sm" style={{ color: colors.inkMuted }}>
          {READING_CALENDAR_COPY.subtitle}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => setCursor((current) => addCalendarMonths(current, -1))}
          className="min-h-[44px] justify-center px-2"
        >
          <Text className="font-semibold" style={{ color: colors.puceRed }}>
            Previous
          </Text>
        </Pressable>
        <Text className="font-semibold" style={{ color: colors.puceRed }}>
          {month.label}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setCursor((current) => addCalendarMonths(current, 1))}
          className="min-h-[44px] justify-center px-2"
        >
          <Text className="font-semibold" style={{ color: colors.puceRed }}>
            Next
          </Text>
        </Pressable>
      </View>
      {showLoading ? (
        <LoadingState message="Loading calendar…" />
      ) : (
        <View>
          <View className="flex-row">
            {month.weekdayLabels.map((label) => (
              <Text
                key={label}
                className="flex-1 text-center text-[10px] font-semibold uppercase"
                style={{ color: colors.inkMuted }}
              >
                {label}
              </Text>
            ))}
          </View>
          {chunkDays(month.days, 7).map((week) => (
            <View key={week[0]?.dateKey} className="mt-1 flex-row">
              {week.map((day) => (
                <View
                  key={day.dateKey}
                  accessibilityLabel={
                    day.qualifying
                      ? `${day.dateKey}: ${day.coverTitle ?? "reading session"}`
                      : day.dateKey
                  }
                  className="m-0.5 min-h-[64px] flex-1 rounded-md border p-1"
                  style={{
                    borderColor: day.qualifying ? colors.primary : colors.border,
                    opacity: day.inMonth ? 1 : 0.35,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text className="text-[10px]" style={{ color: colors.inkMuted }}>
                    {day.dayOfMonth}
                  </Text>
                  {day.qualifying ? (
                    <View className="items-center">
                      <BookCover
                        url={day.coverUrl}
                        title={day.coverTitle ?? "Book"}
                        sizeStyle={{ width: 22, height: 32 }}
                      />
                      {day.bookCount > 1 ? (
                        <Text className="text-[10px] font-semibold" style={{ color: colors.puceRed }}>
                          +{day.bookCount - 1}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
          {!month.days.some((day) => day.inMonth && day.qualifying) ? (
            <Text className="mt-2 text-center text-sm" style={{ color: colors.inkMuted }}>
              {READING_CALENDAR_COPY.emptyMonth}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

function chunkDays<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}
