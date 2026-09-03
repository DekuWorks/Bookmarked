import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActivityFeed } from "./ActivityFeed";
import { CurrentlyReadingRow } from "./CurrentlyReadingRow";
import { OverviewBookShelf, useDeferredOverviewSections } from "./OverviewBookShelf";
import { QuickActionCard } from "./QuickActionCard";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import type { LibraryBookRow } from "../../services/library";
import { selectRecentlyFinishedBooks } from "../../../../../packages/utils/readingRoomHistory";
import {
  FAVORITES_LISTING,
  OVERVIEW_SECTION_TITLES,
  OVERVIEW_SHELF_ACTIONS,
} from "../../../../../packages/utils/overviewCopy";
import { withOriginQuery } from "../../../../../packages/utils/navigationOrigin";
import { OVERVIEW_QUICK_ACTIONS_LIST } from "../../../../../packages/utils/overviewQuickActions";
import { trackProductEvent } from "../../services/productAnalytics";

type Props = {
  userId: string;
  books: LibraryBookRow[];
  currentlyReading: LibraryBookRow[];
  onSelectTab: (tab: "trail" | "history") => void;
  onRefresh: () => void;
};

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

  return (
    <View className="gap-4 md:gap-6">
      <SectionCard
        title={OVERVIEW_SECTION_TITLES.currentlyReading}
        shelfIconId="currently_reading"
        action={
          <Pressable
            onPress={() =>
              router.push(withOriginQuery("/library/reading", { origin: "home_overview" }))
            }
            accessibilityRole="button"
            accessibilityLabel={OVERVIEW_SHELF_ACTIONS.viewShelf}
          >
            <Text className="text-sm font-semibold text-primary-dark">
              {OVERVIEW_SHELF_ACTIONS.viewShelf} ›
            </Text>
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
              viewAllLabel={OVERVIEW_SHELF_ACTIONS.viewShelf}
              onViewAll={() =>
                router.push(withOriginQuery("/library/read", { origin: "home_overview" }))
              }
            />
          </View>

          <View className="md:flex-1">
            <OverviewBookShelf
              title={OVERVIEW_SECTION_TITLES.favorites}
              emoji="⭐"
              items={favorites}
              showFavoriteBadge
              emptyMessage={FAVORITES_LISTING.empty}
              viewAllLabel={OVERVIEW_SHELF_ACTIONS.viewAll}
              onViewAll={() =>
                router.push(withOriginQuery(FAVORITES_LISTING.mobilePath, { origin: "home_overview" }))
              }
            />
          </View>
        </View>
      ) : (
        <LoadingState message="Loading shelves…" />
      )}

      <SectionCard title={OVERVIEW_SECTION_TITLES.quickActions}>
        <View className="-mx-1.5 flex-row flex-wrap">
          {OVERVIEW_QUICK_ACTIONS_LIST.map((action) => (
            <View key={action.id} className="mb-3 w-1/2 px-1.5 md:w-1/3">
              <QuickActionCard
                action={action}
                onPress={() => {
                  trackProductEvent(action.analyticsEvent);
                  router.push(action.mobileHref);
                }}
              />
            </View>
          ))}
        </View>
      </SectionCard>

      {deferredReady ? <ActivityFeed userId={userId} onViewAll={() => onSelectTab("history")} /> : null}
    </View>
  );
}
