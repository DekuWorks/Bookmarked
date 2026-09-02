import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { parseReadingRoomTab } from "../../../../packages/utils/readingRoomTabs";
import { BrandTopHeader } from "../../src/components/BrandTopHeader";
import { ScreenGradientWash } from "../../src/components/ScreenGradientWash";
import { LoadingState } from "../../src/components/LoadingState";
import { AnalyticsGrid } from "../../src/components/AnalyticsGrid";
import { ReadingGoalPanel } from "../../src/components/ReadingGoalPanel";
import { ReadingInsightsSection } from "../../src/components/ReadingInsightsSection";
import { SectionCard } from "../../src/components/SectionCard";
import { SegmentedTabs } from "../../src/components/SegmentedTabs";
import { HistoryPanel } from "../../src/components/reading-room/HistoryPanel";
import { NotesPanel } from "../../src/components/reading-room/NotesPanel";
import { OverviewTab } from "../../src/components/reading-room/OverviewTab";
import { ReviewsPanel } from "../../src/components/reading-room/ReviewsPanel";
import { TrailPanel } from "../../src/components/reading-room/TrailPanel";
import {
  READING_ROOM_TAB_OPTIONS,
  type ReadingRoomTab,
} from "../../src/constants/readingRoomTabs";
import { useProfile } from "../../src/hooks/useProfile";
import { getUserLibraryBooks } from "../../src/services/library";
import { loadReadingAnalytics } from "../../src/services/analytics";
import { computeReadingGoal } from "../../src/services/readingGoal";
import { searchNotesWithBooks } from "../../src/services/readingNotes";
import { listUserReviews } from "../../src/services/readingRoom";
import { listUserReadingSessions } from "../../src/services/readingSessions";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../src/navigation/TabBarScroll";
import { SERIF_DISPLAY_FONT } from "../../src/constants/theme";
import { useAuthStore } from "../../src/store/authStore";
import { useThemeColors } from "../../src/store/themeStore";

function parseReadingRoomTabParam(value: string | string[] | undefined): ReadingRoomTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return parseReadingRoomTab(raw ?? null);
}

export default function HomeReadingRoom() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { onScroll } = useTabBarScroll();
  const [tab, setTab] = useState<ReadingRoomTab>("overview");

  useEffect(() => {
    setTab(parseReadingRoomTabParam(tabParam));
  }, [tabParam]);

  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof listUserReadingSessions>> | null>(
    null
  );
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof listUserReviews>> | null>(null);
  const [recentNotes, setRecentNotes] = useState<
    Awaited<ReturnType<typeof searchNotesWithBooks>> | null
  >(null);

  const library = useQuery({
    queryKey: ["library", userId],
    queryFn: () => getUserLibraryBooks(userId as string),
    enabled: Boolean(userId),
  });

  const analytics = useQuery({
    queryKey: ["reading-analytics", userId, library.dataUpdatedAt],
    queryFn: () =>
      loadReadingAnalytics(
        userId as string,
        library.data ?? [],
        profile?.favorite_genres ?? null
      ),
    enabled: Boolean(userId) && tab === "progress" && library.data != null,
  });

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    const rows = await listUserReadingSessions(userId);
    setSessions(rows);
  }, [userId]);

  const loadReviews = useCallback(async () => {
    if (!userId) return;
    const rows = await listUserReviews(userId);
    setReviews(rows);
  }, [userId]);

  const loadNotes = useCallback(async () => {
    if (!userId) return;
    const rows = await searchNotesWithBooks({
      userId,
      limit: 5,
    });
    setRecentNotes(rows);
  }, [userId]);

  useEffect(() => {
    if (tab === "trail" || tab === "history") {
      void loadSessions();
    }
  }, [tab, loadSessions]);

  useEffect(() => {
    if (tab === "reviews") {
      void loadReviews();
    }
  }, [tab, loadReviews]);

  useEffect(() => {
    if (tab === "notes") {
      void loadNotes();
    }
  }, [tab, loadNotes]);

  const books = library.data ?? [];
  const currentlyReading = useMemo(
    () => books.filter((b) => b.shelf_status === "currently_reading"),
    [books]
  );
  const goal = computeReadingGoal(books, profile?.yearly_reading_goal ?? null);
  const name = profile?.display_name?.trim() || profile?.username?.trim() || "reader";

  function refreshAll() {
    library.refetch();
    void refetchProfile();
    if (tab === "progress") void analytics.refetch();
    if (tab === "trail" || tab === "history") void loadSessions();
    if (tab === "reviews") void loadReviews();
    if (tab === "notes") void loadNotes();
  }

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
            onRefresh={refreshAll}
            tintColor="#642F37"
          />
        }
      >
        <View accessibilityRole="header">
          <Text
            className="text-3xl"
            style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed }}
          >
            Reading Room
          </Text>
          <Text style={{ color: colors.inkMuted }}>Welcome back, {name}.</Text>
        </View>

        <SegmentedTabs
          accessibilityLabel="Reading room sections"
          className="w-full"
          compact
          equalWidth
          options={READING_ROOM_TAB_OPTIONS}
          value={tab}
          onChange={setTab}
        />

        {tab === "overview" && userId ? (
          <OverviewTab
            userId={userId}
            books={books}
            currentlyReading={currentlyReading}
            onSelectTab={setTab}
            onRefresh={() => void library.refetch()}
          />
        ) : null}

        {tab === "progress" ? (
          <>
            <SectionCard title="Reading goal" emoji="🎯">
              <ReadingGoalPanel status={goal} />
            </SectionCard>
            <SectionCard title="Reading statistics" emoji="📈">
              {analytics.isLoading ? (
                <LoadingState message="Loading statistics…" />
              ) : analytics.data ? (
                <AnalyticsGrid analytics={analytics.data} readingGoal={goal} />
              ) : (
                <Text className="text-ink-muted">Sign in to view your reading statistics.</Text>
              )}
            </SectionCard>
            <ReadingInsightsSection />
          </>
        ) : null}

        {tab === "trail" ? <TrailPanel sessions={sessions} /> : null}

        {tab === "notes" ? <NotesPanel notes={recentNotes} /> : null}

        {tab === "reviews" ? <ReviewsPanel reviews={reviews} /> : null}

        {tab === "history" ? <HistoryPanel books={books} sessions={sessions} /> : null}
      </Animated.ScrollView>
    </View>
  );
}
