import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { LoadingState } from "../../src/components/LoadingState";
import { PremiumFeatureLock } from "../../src/components/PremiumFeatureLock";
import { useSubscription } from "../../src/hooks/useSubscription";
import { useAuthStore } from "../../src/store/authStore";
import { loadMonthlyWrapped } from "../../src/services/monthlyWrapped";
import { MONTHLY_WRAPPED_COPY, type MonthlyWrappedRecap } from "../../../../packages/utils/monthlyWrapped";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";

export default function MonthlyWrappedRoute() {
  const userId = useAuthStore((s) => s.user?.id);
  const { canAccess, loading } = useSubscription();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [recap, setRecap] = useState<MonthlyWrappedRecap | null>(null);
  const [months, setMonths] = useState<Array<{ year: number; month: number }>>([]);

  useEffect(() => {
    if (!userId || !canAccess("monthly_wrapped")) return;
    void loadMonthlyWrapped(userId, year, month).then(({ recap: next, months: available }) => {
      setRecap(next);
      setMonths(available.length > 0 ? available : [{ year, month }]);
    });
  }, [userId, year, month, canAccess]);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={MONTHLY_WRAPPED_COPY.title} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 12 }}>
        {loading ? (
          <LoadingState message="Loading…" />
        ) : !canAccess("monthly_wrapped") ? (
          <PremiumFeatureLock
            title="Monthly Wrapped"
            description="A Plus recap of the month you actually read."
          />
        ) : !recap ? (
          <LoadingState message="Building your recap…" />
        ) : (
          <>
            <Text className="text-center text-sm text-ink-muted">{MONTHLY_WRAPPED_COPY.subtitle}</Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {months.map((option) => (
                <Pressable
                  key={`${option.year}-${option.month}`}
                  onPress={() => {
                    setYear(option.year);
                    setMonth(option.month);
                  }}
                  className="rounded-full border border-brand-border px-3 py-1"
                >
                  <Text className="text-xs text-puce-red">
                    {option.year}-{String(option.month).padStart(2, "0")}
                  </Text>
                </Pressable>
              ))}
            </View>
            {!recap.hasData ? (
              <Text className="text-center text-sm text-ink-muted">{MONTHLY_WRAPPED_COPY.emptyMonth}</Text>
            ) : (
              <>
                <Text className="text-lg font-semibold text-puce-red">{recap.monthLabel}</Text>
                <Text className="text-sm text-ink-muted">Books finished: {recap.booksFinished}</Text>
                <Text className="text-sm text-ink-muted">Pages: {recap.pagesRead}</Text>
                <Text className="text-sm text-ink-muted">Listening minutes: {recap.listeningMinutes}</Text>
                <Text className="text-sm text-ink-muted">Active days: {recap.activeDays}</Text>
                <Text className="text-xs text-ink-muted">{MONTHLY_WRAPPED_COPY.shareHint}</Text>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
