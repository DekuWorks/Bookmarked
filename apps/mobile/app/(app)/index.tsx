import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { legacyTrailLocation } from "../../../../packages/utils/bookTrail";
import { resolveReadingRoomDestination } from "../../../../packages/utils/readingRoomTabs";
import { BrandTopHeader } from "../../src/components/BrandTopHeader";
import { ScreenGradientWash } from "../../src/components/ScreenGradientWash";
import { LoadingState } from "../../src/components/LoadingState";
import { AnalyticsGrid } from "../../src/components/AnalyticsGrid";
import { ReadingCalendar } from "../../src/components/ReadingCalendar";
import { ReadingInsightsSection } from "../../src/components/ReadingInsightsSection";
import { SectionCard } from "../../src/components/SectionCard";
import { StatsEnter } from "../../src/components/StatsEnter";
import { StatsSectionSkeleton } from "../../src/components/StatsSectionSkeleton";
import { SegmentedTabs } from "../../src/components/SegmentedTabs";
import { HistoryPanel } from "../../src/components/reading-room/HistoryPanel";
import { NotesPanel } from "../../src/components/reading-room/NotesPanel";
import { OverviewTab } from "../../src/components/reading-room/OverviewTab";
import { ReviewsPanel } from "../../src/components/reading-room/ReviewsPanel";
import {
  READING_ROOM_TAB_OPTIONS,
  type ReadingRoomTab,
} from "../../src/constants/readingRoomTabs";
import {
  READING_CALENDAR_QUERY_KEY,
  readingSessionsQueryKey,
} from "../../src/constants/readingSessionQueries";
import { useProfile } from "../../src/hooks/useProfile";
import { getUserLibraryBooks, type LibraryBookRow } from "../../src/services/library";
import { loadReadingAnalytics } from "../../src/services/analytics";
import { computeReadingGoal } from "../../src/services/readingGoal";
import { listUserReviews } from "../../src/services/readingRoom";
import { listUserReadingSessions } from "../../src/services/readingSessions";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../src/navigation/TabBarScroll";
import { SERIF_DISPLAY_FONT } from "../../src/constants/theme";
import { useAuthStore } from "../../src/store/authStore";
import { useThemeColors } from "../../src/store/themeStore";
import { usePrefersReducedMotion } from "../../src/hooks/usePrefersReducedMotion";
import { READING_ROOM_MOTION, relocateLibraryBook } from "../../../../packages/utils/readingRoomMotion";

function firstParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? null;
}

export default function HomeReadingRoom() {
  const router = useRouter();
  const { tab: tabParam, book: bookParam, section: sectionParam } = useLocalSearchParams<{
    tab?: string;
    book?: string;
    section?: string;
  }>();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { onScroll } = useTabBarScroll();
  const [tab, setTab] = useState<ReadingRoomTab>("overview");
  const [notesPickerOpen, setNotesPickerOpen] = useState(false);
  const [focusGeneration, setFocusGeneration] = useState(0);
  const [keepNotes, setKeepNotes] = useState(false);
  const [keepReviews, setKeepReviews] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const panelOpacity = useSharedValue(1);
  const panelShift = useSharedValue(0);
  const firstPanel = useRef(true);
  const moveSnapshot = useRef<LibraryBookRow[] | null>(null);

  const redirectedProgress = useRef(false);

  useEffect(() => {
    const raw = firstParam(tabParam);
    const legacy = legacyTrailLocation({
      tab: raw,
      bookId: firstParam(bookParam),
      platform: "mobile",
    });
    if (legacy) {
      router.replace(legacy.href as never);
      return;
    }
    const section = firstParam(sectionParam);
    const next = resolveReadingRoomDestination(raw, section);
    setTab(next);
    if (raw === "progress" && !redirectedProgress.current) {
      redirectedProgress.current = true;
      router.setParams({ tab: next === "overview" ? "" : next });
    }
  }, [bookParam, router, sectionParam, tabParam]);

  useEffect(() => {
    if (tab !== "notes") setNotesPickerOpen(false);
    if (tab === "notes") setKeepNotes(true);
    if (tab === "reviews") setKeepReviews(true);
  }, [tab]);

  useEffect(() => {
    if (firstPanel.current) {
      firstPanel.current = false;
      return;
    }
    if (reducedMotion) return;
    panelOpacity.value = 0;
    panelShift.value = READING_ROOM_MOTION.tabContentShiftPx;
    panelOpacity.value = withTiming(1, {
      duration: READING_ROOM_MOTION.tabContentMs,
      easing: Easing.out(Easing.cubic),
    });
    panelShift.value = withTiming(0, {
      duration: READING_ROOM_MOTION.tabContentMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [panelOpacity, panelShift, reducedMotion, tab]);

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
    enabled: Boolean(userId) && tab === "stats" && library.data != null,
  });

  const sessionsQuery = useQuery({
    queryKey: readingSessionsQueryKey(userId ?? ""),
    queryFn: () => listUserReadingSessions(userId as string),
    enabled: Boolean(userId) && tab === "history",
  });

  const loadReviews = useCallback(async () => {
    if (!userId) return;
    const rows = await listUserReviews(userId);
    setReviews(rows);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setFocusGeneration((current) => current + 1);
      if (!userId) return;
      void queryClient.invalidateQueries({ queryKey: [READING_CALENDAR_QUERY_KEY] });
      if (tab === "history") {
        void queryClient.invalidateQueries({ queryKey: readingSessionsQueryKey(userId) });
      }
    }, [queryClient, tab, userId])
  );

  useEffect(() => {
    if (tab === "reviews") {
      void loadReviews();
    }
  }, [tab, loadReviews]);

  const books = library.data ?? [];
  const sessions = sessionsQuery.data ?? null;
  const currentlyReading = useMemo(
    () => books.filter((b) => b.shelf_status === "currently_reading"),
    [books]
  );
  const goal = computeReadingGoal(books, profile?.yearly_reading_goal ?? null);

  function refreshAll() {
    library.refetch();
    void refetchProfile();
    if (tab === "stats") {
      void analytics.refetch();
      void queryClient.invalidateQueries({ queryKey: [READING_CALENDAR_QUERY_KEY] });
    }
    if (tab === "history") {
      void queryClient.invalidateQueries({
        queryKey: readingSessionsQueryKey(userId ?? ""),
      });
    }
    if (tab === "reviews") void loadReviews();
    if (tab === "notes") setNotesRefreshId((id) => id + 1);
  }

  function beginMove(row: LibraryBookRow) {
    if (!userId) return;
    const previous = queryClient.getQueryData<LibraryBookRow[]>(["library", userId]);
    if (!previous) return;
    moveSnapshot.current = previous;
    queryClient.setQueryData(
      ["library", userId],
      relocateLibraryBook(previous, row.id, "currently_reading")
    );
  }

  function failMove() {
    if (!userId || !moveSnapshot.current) return;
    queryClient.setQueryData(["library", userId], moveSnapshot.current);
    moveSnapshot.current = null;
  }

  const panelStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value,
    transform: [{ translateY: panelShift.value }],
  }));

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
        scrollEnabled={!notesPickerOpen}
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
        <View accessibilityRole="header" className="items-center">
          <Text
            className="text-center text-4xl"
            style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed }}
          >
            Reading Room
          </Text>
        </View>

        <SegmentedTabs
          accessibilityLabel="Reading room sections"
          className="w-full"
          compact
          equalWidth
          slidingIndicator
          options={READING_ROOM_TAB_OPTIONS}
          value={tab}
          onChange={(next) => {
            setTab(next);
            router.setParams({ tab: next === "overview" ? "" : next });
          }}
        />

        <Animated.View style={[{ gap: 16 }, panelStyle]}>
          {userId ? (
            <View style={{ display: tab === "overview" ? "flex" : "none" }}>
              <OverviewTab
                userId={userId}
                books={books}
                currentlyReading={currentlyReading}
                readingGoal={goal}
                dataSettled={library.isSuccess}
                focusGeneration={focusGeneration}
                onRefresh={() => void library.refetch()}
                onMoveStart={beginMove}
                onMoveFailed={failMove}
              />
            </View>
          ) : null}

          {tab === "stats" ? (
            <>
              {userId ? (
                <StatsEnter index={0}>
                  <SectionCard title="Reading Calendar">
                    <ReadingCalendar userId={userId} showTitle={false} />
                  </SectionCard>
                </StatsEnter>
              ) : null}
              <StatsEnter index={1}>
              <SectionCard title="Reading Statistics">
                {analytics.isLoading ? (
                  <StatsSectionSkeleton label="Loading reading statistics" />
                ) : analytics.data ? (
                  <AnalyticsGrid analytics={analytics.data} readingGoal={goal} />
                ) : (
                  <Text className="text-ink-muted">Sign in to view your reading statistics.</Text>
                )}
                <Pressable
                  onPress={() => router.push("/wrapped")}
                  accessibilityRole="link"
                  accessibilityLabel="Your year in books"
                  className="mt-4 min-h-11 justify-center self-center"
                >
                  <Text className="text-center text-sm font-semibold text-primary-dark">
                    Your year in books
                  </Text>
                </Pressable>
              </SectionCard>
              </StatsEnter>
              <ReadingInsightsSection />
            </>
          ) : null}

          {keepNotes && userId ? (
            <View style={{ display: tab === "notes" ? "flex" : "none" }}>
              <NotesPanel
                userId={userId}
                bookParam={Array.isArray(bookParam) ? bookParam[0] : bookParam}
                refreshId={notesRefreshId}
                onPickerOpenChange={setNotesPickerOpen}
              />
            </View>
          ) : null}

          {keepReviews ? (
            <View style={{ display: tab === "reviews" ? "flex" : "none" }}>
              <ReviewsPanel
                reviews={reviews}
                onReviewsChange={() => {
                  void loadReviews();
                  void queryClient.invalidateQueries({ queryKey: ["home-feed"] });
                  void queryClient.invalidateQueries({ queryKey: ["reader-activity"] });
                  void queryClient.invalidateQueries({ queryKey: ["book-details"] });
                }}
              />
            </View>
          ) : null}

          {tab === "history" ? <HistoryPanel books={books} sessions={sessions} /> : null}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}
