import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { parseReadingRoomTab } from "../../../../packages/utils/readingRoomTabs";
import { BrandTopHeader } from "../../src/components/BrandTopHeader";
import { ScreenGradientWash } from "../../src/components/ScreenGradientWash";
import { LoadingState } from "../../src/components/LoadingState";
import { AnalyticsGrid } from "../../src/components/AnalyticsGrid";
import { ReadingCalendar } from "../../src/components/ReadingCalendar";
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
  const router = useRouter();
  const { tab: tabParam, book: bookParam } = useLocalSearchParams<{
    tab?: string;
    book?: string;
  }>();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
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
  const [notesRefreshId, setNotesRefreshId] = useState(0);

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
    if (tab === "notes") setNotesRefreshId((id) => id + 1);
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
            <SectionCard title="Reading Goal">
              <ReadingGoalPanel status={goal} />
            </SectionCard>
            <Pressable
              onPress={() => router.push("/wrapped")}
              accessibilityRole="button"
              className="self-start"
            >
              <Text className="text-sm font-semibold text-primary-dark">Your year in books ›</Text>
            </Pressable>
            {userId ? (
              <SectionCard title="Reading calendar">
                <ReadingCalendar userId={userId} />
              </SectionCard>
            ) : null}
            <SectionCard title="Reading Statistics">
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

        {tab === "notes" && userId ? (
          <NotesPanel
            userId={userId}
            bookParam={Array.isArray(bookParam) ? bookParam[0] : bookParam}
            refreshId={notesRefreshId}
          />
        ) : null}

        {tab === "reviews" ? (
          <ReviewsPanel
            reviews={reviews}
            onReviewsChange={() => {
              void loadReviews();
              void queryClient.invalidateQueries({ queryKey: ["home-feed"] });
              void queryClient.invalidateQueries({ queryKey: ["reader-activity"] });
              void queryClient.invalidateQueries({ queryKey: ["book-details"] });
            }}
          />
        ) : null}

        {tab === "history" ? <HistoryPanel books={books} sessions={sessions} /> : null}
      </Animated.ScrollView>
    </View>
  );
}
