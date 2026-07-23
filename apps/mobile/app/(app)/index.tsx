import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { BrandTopHeader } from "../../src/components/BrandTopHeader";
import { CoverTile } from "../../src/components/CoverTile";
import { ScreenGradientWash } from "../../src/components/ScreenGradientWash";
import { LoadingState } from "../../src/components/LoadingState";
import { ReadingGoalPanel } from "../../src/components/ReadingGoalPanel";
import { ReadingInsightsSection } from "../../src/components/ReadingInsightsSection";
import { SectionCard } from "../../src/components/SectionCard";
import { SegmentedTabs } from "../../src/components/SegmentedTabs";
import { ShelfIcon } from "../../src/components/ShelfIcon";
import type { ShelfIconId } from "../../src/constants/shelfIcons";
import { ActivityFeed } from "../../src/components/reading-room/ActivityFeed";
import { HistoryPanel } from "../../src/components/reading-room/HistoryPanel";
import { NotesPanel } from "../../src/components/reading-room/NotesPanel";
import { ReviewsPanel } from "../../src/components/reading-room/ReviewsPanel";
import { TrailPanel } from "../../src/components/reading-room/TrailPanel";
import {
  READING_ROOM_TAB_OPTIONS,
  type ReadingRoomTab,
} from "../../src/constants/readingRoomTabs";
import { useProfile } from "../../src/hooks/useProfile";
import { getUserLibraryBooks } from "../../src/services/library";
import { computeReadingGoal } from "../../src/services/readingGoal";
import { searchNotesWithBooks } from "../../src/services/readingNotes";
import { listUserReviews } from "../../src/services/readingRoom";
import { listUserReadingSessions } from "../../src/services/readingSessions";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../src/navigation/TabBarScroll";
import { SERIF_DISPLAY_FONT } from "../../src/constants/theme";
import { useAuthStore } from "../../src/store/authStore";
import { useThemeColors } from "../../src/store/themeStore";

function QuickLink({
  icon,
  shelfIconId,
  label,
  onPress,
}: {
  icon?: string;
  shelfIconId?: ShelfIconId;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center rounded-2xl border border-brand-border bg-surface py-3 active:opacity-80"
    >
      {shelfIconId ? (
        <ShelfIcon id={shelfIconId} size="medium" />
      ) : (
        <Text className="text-xl">{icon}</Text>
      )}
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
  const [tab, setTab] = useState<ReadingRoomTab>("overview");
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
    const rows = await searchNotesWithBooks({ userId, limit: 12 });
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
  const recentlyFinished = useMemo(
    () =>
      books
        .filter((b) => b.shelf_status === "read" && b.finished_at)
        .sort((a, b) => new Date(b.finished_at!).getTime() - new Date(a.finished_at!).getTime())
        .slice(0, 10),
    [books]
  );
  const favorites = useMemo(() => books.filter((b) => b.is_favorite).slice(0, 8), [books]);
  const goal = computeReadingGoal(books, profile?.yearly_reading_goal ?? null);
  const name = profile?.display_name?.trim() || profile?.username?.trim() || "reader";
  const continueReadingBook = currentlyReading.find((b) => b.books?.id);

  function refreshAll() {
    library.refetch();
    void refetchProfile();
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
        <View>
          <Text
            className="text-3xl"
            style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed }}
          >
            Reading Room
          </Text>
          <Text style={{ color: colors.inkMuted }}>Welcome back, {name}.</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SegmentedTabs options={READING_ROOM_TAB_OPTIONS} value={tab} onChange={setTab} />
        </ScrollView>

        {tab === "overview" ? (
          <>
            <SectionCard
              title="Currently reading"
              shelfIconId="currently_reading"
              action={
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

            <View className="flex-row gap-3">
              <View className="flex-1">
                <SectionCard title="Recently finished" shelfIconId="read">
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
              </View>

              <View className="flex-1">
                <SectionCard title="Favorites" emoji="⭐">
                  {favorites.length === 0 ? (
                    <Text className="text-ink-muted">
                      Star books from their detail page to collect favorites here.
                    </Text>
                  ) : (
                    <FlatList
                      horizontal
                      data={favorites}
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
              </View>
            </View>

            <SectionCard title="Quick actions" emoji="⚡">
              <View className="flex-row gap-3">
                <QuickLink icon="🔍" label="Search" onPress={() => router.push("/search")} />
                <QuickLink
                  shelfIconId="currently_reading"
                  label="Continue"
                  onPress={() =>
                    continueReadingBook?.books?.id
                      ? router.push(`/book/${continueReadingBook.books.id}`)
                      : router.push("/search")
                  }
                />
                <QuickLink shelfIconId="want_to_read" label="Library" onPress={() => router.push("/library")} />
              </View>
            </SectionCard>

            {userId ? <ActivityFeed userId={userId} /> : null}
          </>
        ) : null}

        {tab === "progress" ? (
          <>
            <SectionCard title="Reading goal" emoji="🎯">
              <ReadingGoalPanel status={goal} />
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
