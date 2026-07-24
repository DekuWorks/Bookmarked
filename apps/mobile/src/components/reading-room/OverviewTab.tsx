import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActivityFeed } from "./ActivityFeed";
import { OverviewBookShelf, useDeferredOverviewSections } from "./OverviewBookShelf";
import { CoverTile } from "../CoverTile";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import type { LibraryBookRow } from "../../services/library";
import { selectRecentlyFinishedBooks } from "../../../../../packages/utils/readingRoomHistory";

type Props = {
  userId: string;
  books: LibraryBookRow[];
  currentlyReading: LibraryBookRow[];
  onSelectTab: (tab: "trail" | "history") => void;
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
      className="min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-brand-border bg-surface py-3 active:opacity-80"
    >
      {icon ? <Text className="text-xl">{icon}</Text> : null}
      <Text className="mt-1 text-xs font-medium text-puce-red">{label}</Text>
    </Pressable>
  );
}

export function OverviewTab({ userId, books, currentlyReading, onSelectTab }: Props) {
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
        title="Currently reading"
        shelfIconId="currently_reading"
        action={
          <Pressable onPress={() => router.push("/library/reading")} accessibilityRole="button">
            <Text className="text-sm font-semibold text-primary-dark">View shelf ›</Text>
          </Pressable>
        }
      >
        {currentlyReading.length === 0 ? (
          <View className="items-center gap-3 py-2">
            <Text className="text-center text-sm text-ink-muted">
              You aren&apos;t currently reading anything.
            </Text>
            <View className="w-full flex-row gap-3">
              <Pressable
                onPress={() => router.push("/search")}
                accessibilityRole="button"
                className="min-h-[44px] flex-1 items-center justify-center rounded-xl border border-brand-border bg-surface px-3 py-2 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-puce-red">Browse books</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/library/want-to-read")}
                accessibilityRole="button"
                className="min-h-[44px] flex-1 items-center justify-center rounded-xl bg-primary px-3 py-2 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-puce-red">Start reading</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {currentlyReading.map((item) => (
              <CoverTile
                key={item.id}
                bookId={item.books?.id}
                title={item.books?.title}
                author={item.books?.author}
                coverUrl={item.books?.cover_url}
                progressPercent={item.progress_percent}
              />
            ))}
          </View>
        )}
      </SectionCard>

      {deferredReady ? (
        <View className="gap-4 md:flex-row md:gap-3">
          <View className="md:flex-1">
            <OverviewBookShelf
              title="Recently finished"
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
              title="Favorites"
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

      <SectionCard title="Quick actions" emoji="⚡">
        <View className="flex-row flex-wrap gap-3">
          <QuickLink icon="🔍" label="Search" onPress={() => router.push("/search")} />
          <QuickLink
            label="Continue"
            onPress={() =>
              continueReadingBook?.books?.id
                ? router.push(`/book/${continueReadingBook.books.id}`)
                : router.push("/search")
            }
          />
          <QuickLink label="Library" onPress={() => router.push("/library")} />
          <QuickLink label="Trail" onPress={() => onSelectTab("trail")} />
        </View>
      </SectionCard>

      {deferredReady ? <ActivityFeed userId={userId} onViewAll={() => onSelectTab("history")} /> : null}
    </View>
  );
}
