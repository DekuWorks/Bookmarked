import { useEffect, useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { LoadingState } from "../../src/components/LoadingState";
import { Button } from "../../src/components/Button";
import { useAuthStore } from "../../src/store/authStore";
import { useThemeColors } from "../../src/store/themeStore";
import { loadYearlyWrapped } from "../../src/services/yearlyWrapped";
import { YEARLY_WRAPPED_COPY, type YearlyWrappedRecap } from "../../../../packages/utils/yearlyWrapped";

export default function WrappedScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [recap, setRecap] = useState<YearlyWrappedRecap | null>(null);
  const [years, setYears] = useState<number[]>([currentYear]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadYearlyWrapped(userId, year).then(({ recap: next, years: available }) => {
      if (cancelled) return;
      setRecap(next);
      setYears(available.length > 0 ? available : [year]);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, year]);

  return (
    <ScreenContainer scroll>
      <Pressable onPress={() => router.back()} className="min-h-[44px] justify-center">
        <Text style={{ color: colors.puceRed }}>‹ Back</Text>
      </Pressable>
      <Text className="mt-2 text-3xl font-bold" style={{ color: colors.puceRed }}>
        {YEARLY_WRAPPED_COPY.title}
      </Text>
      <Text className="mt-1 text-sm" style={{ color: colors.inkMuted }}>
        {YEARLY_WRAPPED_COPY.subtitle}
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {years.map((option) => (
          <Pressable
            key={option}
            onPress={() => setYear(option)}
            className="rounded-full border px-3 py-2"
            style={{
              borderColor: colors.border,
              backgroundColor: option === year ? colors.primary : colors.surface,
            }}
          >
            <Text style={{ color: colors.puceRed }}>{option}</Text>
          </Pressable>
        ))}
      </View>

      {!recap ? (
        <LoadingState message="Building your recap…" />
      ) : !recap.hasData ? (
        <Text className="mt-6 text-sm" style={{ color: colors.inkMuted }}>
          {YEARLY_WRAPPED_COPY.emptyYear}
        </Text>
      ) : (
        <View className="mt-4 gap-3">
          <WrappedStat label="Books finished" value={String(recap.booksFinished)} />
          <WrappedStat label="Pages read" value={String(recap.pagesRead)} />
          <WrappedStat label="Listening minutes" value={String(recap.listeningMinutes)} />
          <WrappedStat label="Active reading days" value={String(recap.activeDays)} />
          <WrappedStat label="Longest streak" value={`${recap.longestStreak} days`} />
          <WrappedStat label="Reviews written" value={String(recap.reviewsWritten)} />
          <WrappedStat label="Quotes saved" value={String(recap.quotesSaved)} />
        </View>
      )}

      <Text className="mt-4 text-xs" style={{ color: colors.inkMuted }}>
        {YEARLY_WRAPPED_COPY.shareHint}
      </Text>
      <Button
        title="Share recap"
        className="mt-3"
        disabled={!recap?.hasData}
        onPress={() => {
          if (!recap?.hasData) return;
          void Share.share({
            message: `My ${recap.year} on Bookmarked: ${recap.booksFinished} books finished, ${recap.activeDays} reading days, longest streak ${recap.longestStreak}.`,
          });
        }}
      />
    </ScreenContainer>
  );
}

function WrappedStat({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View className="rounded-2xl border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
      <Text className="text-xs uppercase" style={{ color: colors.inkMuted }}>
        {label}
      </Text>
      <Text className="mt-1 text-xl font-semibold" style={{ color: colors.puceRed }}>
        {value}
      </Text>
    </View>
  );
}
