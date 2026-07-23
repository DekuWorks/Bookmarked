import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  getReadingActivityData,
  getReadingHeatmapData,
  type ReadingActivityData,
} from "../services/readingActivity";
import type { ReadingPagesByDay } from "../services/readingSessions";

type Props = {
  userId: string;
  showHeatmap?: boolean;
};

function heatmapOpacity(pages: number, max: number): number {
  if (pages <= 0 || max <= 0) return 0.2;
  const ratio = pages / max;
  if (ratio >= 0.75) return 1;
  if (ratio >= 0.5) return 0.7;
  if (ratio >= 0.25) return 0.4;
  return 0.2;
}

function formatHeatmapTitle(day: string, pages: number): string {
  const date = new Date(`${day}T12:00:00.000Z`);
  const label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (pages <= 0) return `${label}: no reading`;
  return `${label}: ${pages} page${pages === 1 ? "" : "s"}`;
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 rounded-lg border border-brand-border bg-background/50 px-3 py-3">
      <Text className="text-center text-2xl font-bold text-puce-red">{value}</Text>
      <Text className="text-center text-xs text-ink-muted">{label}</Text>
    </View>
  );
}

export function ReadingActivityPanel({ userId, showHeatmap = true }: Props) {
  const [activity, setActivity] = useState<ReadingActivityData | null>(null);
  const [heatmap, setHeatmap] = useState<ReadingPagesByDay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activityData, heatmapData] = await Promise.all([
        getReadingActivityData(userId),
        showHeatmap ? getReadingHeatmapData(userId) : Promise.resolve([]),
      ]);
      setActivity(activityData);
      setHeatmap(heatmapData);
    } finally {
      setLoading(false);
    }
  }, [userId, showHeatmap]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Text className="text-sm text-ink-muted">Loading reading activity…</Text>;
  }

  if (!activity) return null;

  const maxPages = Math.max(1, ...activity.pagesByDay.map((day) => day.pages_read));
  const heatmapMax = Math.max(1, ...heatmap.map((day) => day.pages_read));
  const hasAnyActivity =
    activity.stats.total_pages > 0 ||
    activity.stats.session_count > 0 ||
    heatmap.some((day) => day.pages_read > 0);

  if (!hasAnyActivity) {
    return (
      <Text className="text-sm text-ink-muted">
        Log reading progress on your books to see weekly charts here.
      </Text>
    );
  }

  return (
    <View className="gap-6">
      <View className="flex-row gap-2">
        <StatPill value={activity.stats.total_pages} label="Pages this week" />
        <StatPill value={activity.stats.active_days} label="Active days" />
        <StatPill value={activity.stats.session_count} label="Sessions" />
      </View>

      <View>
        <Text className="mb-2 text-sm font-medium text-puce-red">Pages per day</Text>
        <View className="flex-row items-end justify-between gap-1">
          {activity.pagesByDay.map((day, index) => {
            const heightPct = day.pages_read > 0 ? (day.pages_read / maxPages) * 100 : 8;
            return (
              <View key={day.day} className="min-w-0 flex-1 items-center gap-1">
                <Text className="text-[10px] text-ink-muted">
                  {day.pages_read > 0 ? day.pages_read : ""}
                </Text>
                <View className="h-16 w-full items-end justify-end">
                  <View
                    className="w-full rounded-t-md bg-royal-orange"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: day.pages_read > 0 ? 8 : 4,
                      opacity: day.pages_read > 0 ? 1 : 0.25,
                    }}
                  />
                </View>
                <Text className="text-[10px] text-ink-muted">{activity.weekLabels[index]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {showHeatmap && heatmap.length > 0 ? (
        <View>
          <Text className="mb-1 text-sm font-medium text-puce-red">Reading calendar</Text>
          <Text className="mb-3 text-xs text-ink-muted">
            Last 12 weeks — darker orange means more pages.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row flex-wrap gap-0.5" style={{ width: 12 * 7 + 6 * 6 }}>
              {heatmap.map((day) => (
                <View
                  key={day.day}
                  accessibilityLabel={formatHeatmapTitle(day.day, day.pages_read)}
                  className="h-3 w-3 rounded-sm bg-border"
                  style={{
                    backgroundColor:
                      day.pages_read > 0
                        ? `rgba(232, 122, 46, ${heatmapOpacity(day.pages_read, heatmapMax)})`
                        : undefined,
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
