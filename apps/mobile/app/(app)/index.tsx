import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { BrandTopHeader } from "../../src/components/BrandTopHeader";
import { StatTile } from "../../src/components/StatTile";
import { CoverTile } from "../../src/components/CoverTile";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenGradientWash } from "../../src/components/ScreenGradientWash";
import { LoadingState } from "../../src/components/LoadingState";
import { ReadingGoalPanel } from "../../src/components/ReadingGoalPanel";
import { ReadingInsightsSection } from "../../src/components/ReadingInsightsSection";
import { SectionCard } from "../../src/components/SectionCard";
import { useProfile } from "../../src/hooks/useProfile";
import { getUserLibraryBooks } from "../../src/services/library";
import { computeReadingGoal } from "../../src/services/readingGoal";
import { fetchTrendingSections } from "../../src/services/trending";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../src/navigation/TabBarScroll";
import { SERIF_DISPLAY_FONT } from "../../src/constants/theme";
import { useAuthStore } from "../../src/store/authStore";
import { useThemeColors } from "../../src/store/themeStore";

function QuickLink({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center rounded-2xl border border-brand-border bg-surface py-3 active:opacity-80"
    >
      <Text className="text-xl">{icon}</Text>
      <Text className="mt-1 text-xs font-medium text-puce-red">{label}</Text>
    </Pressable>
  );
}

export default function HomeReadingRoom() {
  const router = useRouter();
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { onScroll } = useTabBarScroll();

  const library = useQuery({
    queryKey: ["library", userId],
    queryFn: () => getUserLibraryBooks(userId as string),
    enabled: Boolean(userId),
  });
  const trending = useQuery({ queryKey: ["trending"], queryFn: fetchTrendingSections });

  const books = library.data ?? [];
  const currentlyReading = useMemo(
    () => books.filter((b) => b.shelf_status === "currently_reading"),
    [books]
  );
  const recentlyFinished = useMemo(
    () =>
      books
        .filter((b) => b.shelf_status === "read" && b.finished_at)
        .sort((a, b) => new Date(b.finished_at!).getTime() - new Date(a.finished_at!).getTime())
        .slice(0, 10),
    [books]
  );
  const goal = computeReadingGoal(books, profile?.yearly_reading_goal ?? null);
  const name = profile?.display_name?.trim() || profile?.username?.trim() || "reader";
  const trendingBooks = trending.data?.[0]?.books ?? [];

  if (library.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenGradientWash />
        <BrandTopHeader />
        <LoadingState message="Loading your reading room…" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenGradientWash />
      <BrandTopHeader />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={library.isRefetching}
            onRefresh={() => {
              library.refetch();
              trending.refetch();
              void refetchProfile();
            }}
            tintColor="#642F37"
          />
        }
      >
        <View>
          <Text
            className="text-3xl"
            style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed }}
          >
            Reading Room
          </Text>
          <Text style={{ color: colors.inkMuted }}>Welcome back, {name}.</Text>
        </View>

        <View className="flex-row gap-3">
          <StatTile value={goal.completed} label={`Finished in ${goal.year}`} />
          <StatTile value={currentlyReading.length} label="Reading now" />
          <StatTile value={books.length} label="On shelves" />
        </View>

        <SectionCard title="Currently reading" emoji="📖" action={
          <Pressable onPress={() => router.push("/library/reading")}>
            <Text className="text-sm font-semibold text-primary-dark">View shelf ›</Text>
          </Pressable>
        }>
          {currentlyReading.length === 0 ? (
            <Text className="text-ink-muted">
              Nothing in progress. Add a book from Search to start reading.
            </Text>
          ) : (
            <FlatList
              horizontal
              data={currentlyReading}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <CoverTile
                  bookId={item.books?.id}
                  title={item.books?.title}
                  author={item.books?.author}
                  coverUrl={item.books?.cover_url}
                  progressPercent={item.progress_percent}
                />
              )}
            />
          )}
        </SectionCard>

        <SectionCard title="Reading goal" emoji="🎯">
          <ReadingGoalPanel status={goal} />
        </SectionCard>

        <ReadingInsightsSection />

        <View className="flex-row gap-3">
          <QuickLink icon="📚" label="Library" onPress={() => router.push("/library")} />
          <QuickLink icon="📝" label="Notes" onPress={() => router.push("/notes")} />
          <QuickLink icon="🔍" label="Add book" onPress={() => router.push("/search")} />
        </View>

        <SectionCard title="Recently finished" emoji="✅">
          {recentlyFinished.length === 0 ? (
            <Text className="text-ink-muted">Books you finish will appear here.</Text>
          ) : (
            <FlatList
              horizontal
              data={recentlyFinished}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <CoverTile
                  bookId={item.books?.id}
                  title={item.books?.title}
                  author={item.books?.author}
                  coverUrl={item.books?.cover_url}
                />
              )}
            />
          )}
        </SectionCard>

        <SectionCard title="Community picks" emoji="✨">
          {trendingBooks.length === 0 ? (
            <EmptyState title="No trending books yet" description="Check back soon." />
          ) : (
            <FlatList
              horizontal
              data={trendingBooks}
              keyExtractor={(item) => item.bookId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <CoverTile
                  bookId={item.bookId}
                  title={item.title}
                  author={item.author}
                  coverUrl={item.coverUrl}
                />
              )}
            />
          )}
        </SectionCard>
      </Animated.ScrollView>
    </View>
  );
}
