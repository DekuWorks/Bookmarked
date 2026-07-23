import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import {
  getReadingActivityData,
  type ReadingActivityData,
} from "../services/readingActivity";
import { PremiumFeatureLock } from "./PremiumFeatureLock";
import { AiInsightsPanel } from "./AiInsightsPanel";
import { SectionCard } from "./SectionCard";
import { useSubscription } from "../hooks/useSubscription";
import { useAuthStore } from "../store/authStore";

const WEB_ANALYTICS_URL = "https://bookmarked.online/reading-room/?tab=progress";

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 rounded-lg border border-brand-border bg-background/50 px-3 py-3">
      <Text className="text-center text-2xl font-bold text-puce-red">{value}</Text>
      <Text className="text-center text-xs text-ink-muted">{label}</Text>
    </View>
  );
}

function MobileActivitySummary({ data }: { data: ReadingActivityData }) {
  const maxPages = Math.max(1, ...data.pagesByDay.map((day) => day.pages_read));

  return (
    <View className="gap-4">
      <View className="flex-row gap-2">
        <StatPill value={data.stats.total_pages} label="Pages this week" />
        <StatPill value={data.stats.active_days} label="Active days" />
        <StatPill value={data.stats.session_count} label="Sessions" />
      </View>

      <View>
        <Text className="mb-2 text-sm font-medium text-puce-red">Pages per day</Text>
        <View className="flex-row items-end justify-between gap-1">
          {data.pagesByDay.map((day, index) => {
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
                <Text className="text-[10px] text-ink-muted">{data.weekLabels[index]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function ReadingInsightsSection() {
  const userId = useAuthStore((s) => s.user?.id);
  const { canAccess, isPremium } = useSubscription();
  const hasAdvancedAnalytics = canAccess("advanced_analytics");
  const hasAiInsights = canAccess("ai_insights");

  const [activity, setActivity] = useState<ReadingActivityData | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!userId || !hasAdvancedAnalytics) return;
    setActivityLoading(true);
    try {
      const data = await getReadingActivityData(userId);
      setActivity(data);
    } finally {
      setActivityLoading(false);
    }
  }, [userId, hasAdvancedAnalytics]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  return (
    <View className="gap-4">
      <SectionCard title="Reading insights" emoji="📊">
        <View className="gap-4">
          {hasAdvancedAnalytics ? (
            <View className="gap-3">
              {activityLoading ? (
                <Text className="text-sm text-ink-muted">Loading reading activity…</Text>
              ) : activity &&
                (activity.stats.total_pages > 0 || activity.stats.session_count > 0) ? (
                <MobileActivitySummary data={activity} />
              ) : (
                <Text className="text-sm text-ink-muted">
                  Log reading progress on your books to see weekly charts here.
                </Text>
              )}
              <Pressable
                onPress={() => void Linking.openURL(WEB_ANALYTICS_URL)}
                className="rounded-xl border border-brand-border bg-background/60 px-4 py-3"
              >
                <Text className="text-center text-sm font-medium text-primary">
                  View full heatmap on web →
                </Text>
              </Pressable>
            </View>
          ) : (
            <PremiumFeatureLock
              compact
              title="Unlock advanced analytics"
              description="See reading heatmaps, pace trends, and deeper stats in your Reading Room."
            />
          )}

          {hasAiInsights ? (
            userId ? (
              <AiInsightsPanel userId={userId} />
            ) : (
              <Text className="text-sm text-ink-muted">Sign in to view AI insights.</Text>
            )
          ) : (
            <PremiumFeatureLock
              compact
              title="Unlock AI reading insights"
              description="Get personalized highlights, patterns, and reflection prompts from your journal."
            />
          )}
        </View>
      </SectionCard>

      {isPremium ? null : (
        <Text className="text-center text-xs text-ink-muted">
          Premium unlocks analytics and AI insights on web and mobile.
        </Text>
      )}
    </View>
  );
}
