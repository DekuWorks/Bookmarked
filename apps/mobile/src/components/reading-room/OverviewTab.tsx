import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActivityFeed } from "./ActivityFeed";
import { CurrentlyReadingRow } from "./CurrentlyReadingRow";
import { OverviewBookShelf, useDeferredOverviewSections } from "./OverviewBookShelf";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import type { LibraryBookRow } from "../../services/library";
import { selectRecentlyFinishedBooks } from "../../../../../packages/utils/readingRoomHistory";
import { OVERVIEW_QUICK_ACTIONS, OVERVIEW_SECTION_TITLES } from "../../../../../packages/utils/overviewCopy";

type Props = {
  userId: string;
  books: LibraryBookRow[];
  currentlyReading: LibraryBookRow[];
  onSelectTab: (tab: "trail" | "history") => void;
  onRefresh: () => void;
};

function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-brand-border bg-surface py-3 active:opacity-80"
    >
      {icon ? <Text className="text-xl">{icon}</Text> : null}
      <Text className="mt-1 text-center text-xs font-medium text-puce-red">{label}</Text>
    </Pressable>
  );
}

export function OverviewTab({ userId, books, currentlyReading, onSelectTab, onRefresh }: Props) {
  const router = useRouter();
  const deferredReady = useDeferredOverviewSections(true);
  const recentlyFinished = useMemo(
    () => (deferredReady ? selectRecentlyFinishedBooks(books) : []),
    [books, deferredReady]
  );
  const favorites = useMemo(
    () => (deferredReady ? books.filter((book) => book.is_favorite).slice(0, 8) : []),
    [books, deferredReady]
  );
  const continueReadingBook = currentlyReading.find((book) => book.books?.id);

  return (
    <View className="gap-4 md:gap-6">
      <SectionCard
        title={OVERVIEW_SECTION_TITLES.currentlyReading}
        shelfIconId="currently_reading"
        action={
          <Pressable
            onPress={() => router.push("/library/reading")}
            accessibilityRole="button"
            accessibilityLabel="View shelf"
          >
            <Text className="text-sm font-semibold text-primary-dark">View shelf ›</Text>
          </Pressable>
        }
      >
        <CurrentlyReadingRow userId={userId} items={currentlyReading} onRefresh={onRefresh} />
      </SectionCard>

      {deferredReady ? (
        <View className="gap-4 md:flex-row md:gap-3">
          <View className="md:flex-1">
            <OverviewBookShelf
              title={OVERVIEW_SECTION_TITLES.recentlyFinished}
              shelfIconId="read"
              items={recentlyFinished}
              showFinishedDate
              emptyMessage="Books you finish will appear here."
              viewAllLabel="View all"
              onViewAll={() => router.push("/library/read")}
            />
          </View>

          <View className="md:flex-1">
            <OverviewBookShelf
              title={OVERVIEW_SECTION_TITLES.favorites}
              emoji="⭐"
              items={favorites}
              showFavoriteBadge
              emptyMessage="Star books from their detail page to collect favorites here."
              viewAllLabel="View all"
              onViewAll={() => router.push("/library")}
            />
          </View>
        </View>
      ) : (
        <LoadingState message="Loading shelves…" />
      )}

      <SectionCard title={OVERVIEW_SECTION_TITLES.quickActions} emoji="⚡">
        <View className="gap-3">
          <View className="flex-row gap-3">
            <QuickLink
              icon="🔍"
              label={OVERVIEW_QUICK_ACTIONS.searchBooks}
              onPress={() => router.push("/search")}
            />
            <QuickLink
              label={OVERVIEW_QUICK_ACTIONS.continueReading}
              onPress={() =>
                continueReadingBook?.books?.id
                  ? router.push(`/book/${continueReadingBook.books.id}`)
                  : router.push("/search")
              }
            />
          </View>
          <View className="flex-row gap-3">
            <QuickLink
              label={OVERVIEW_QUICK_ACTIONS.openLibrary}
              onPress={() => router.push("/library")}
            />
            <QuickLink label={OVERVIEW_QUICK_ACTIONS.trail} onPress={() => onSelectTab("trail")} />
          </View>
        </View>
      </SectionCard>

      {deferredReady ? <ActivityFeed userId={userId} onViewAll={() => onSelectTab("history")} /> : null}
    </View>
  );
}
