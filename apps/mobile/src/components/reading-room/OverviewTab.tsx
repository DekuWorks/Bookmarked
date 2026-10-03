import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActivityFeed } from "./ActivityFeed";
import { CurrentlyReadingRow } from "./CurrentlyReadingRow";
import { OverviewBookShelf } from "./OverviewBookShelf";
import { QuickActionCard } from "./QuickActionCard";
import { SectionCard } from "../SectionCard";
import type { LibraryBookRow } from "../../services/library";
import { selectRecentlyFinishedBooks } from "../../../../../packages/utils/readingRoomHistory";
import {
  FAVORITES_LISTING,
  OVERVIEW_EMPTY_COPY,
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
  const recentlyFinished = useMemo(() => selectRecentlyFinishedBooks(books), [books]);
  const favorites = useMemo(
    () => books.filter((book) => book.is_favorite).slice(0, 8),
    [books]
  );

  return (
    <View className="gap-6">
      <SectionCard
        title={OVERVIEW_SECTION_TITLES.currentlyReading}
        shelfIconId="currently_reading"
        headerAlign="center"
        action={
          <Pressable
            onPress={() =>
              router.push(withOriginQuery("/library/reading", { origin: "home_overview" }))
            }
            accessibilityRole="link"
            accessibilityLabel={OVERVIEW_SHELF_ACTIONS.viewShelf}
            className="min-h-11 items-center justify-center px-2"
          >
            <Text className="text-center text-sm font-semibold text-primary-dark">
              {OVERVIEW_SHELF_ACTIONS.viewShelf}
            </Text>
          </Pressable>
        }
      >
        <CurrentlyReadingRow userId={userId} items={currentlyReading} onRefresh={onRefresh} />
      </SectionCard>

      <View className="gap-6 md:flex-row">
        <View className="md:flex-1">
          <OverviewBookShelf
            title={OVERVIEW_SECTION_TITLES.recentlyFinished}
            shelfIconId="read"
            items={recentlyFinished}
            showFinishedDate
            emptyMessage={OVERVIEW_EMPTY_COPY.recentlyFinished}
            viewAllLabel={OVERVIEW_SHELF_ACTIONS.viewShelf}
            onViewAll={() =>
              router.push(withOriginQuery("/library/read", { origin: "home_overview" }))
            }
          />
        </View>

        <View className="md:flex-1">
          <OverviewBookShelf
            title={OVERVIEW_SECTION_TITLES.favorites}
            items={favorites}
            showFavoriteBadge
            emptyMessage={FAVORITES_LISTING.empty}
            emptyAction={{
              label: "Find a book",
              onPress: () => router.push("/search"),
            }}
            viewAllLabel={OVERVIEW_SHELF_ACTIONS.viewAll}
            onViewAll={() =>
              router.push(withOriginQuery(FAVORITES_LISTING.mobilePath, { origin: "home_overview" }))
            }
          />
        </View>
      </View>

      <SectionCard title={OVERVIEW_SECTION_TITLES.quickActions} headerAlign="center">
        <View className="flex-row flex-wrap items-stretch gap-3">
          {OVERVIEW_QUICK_ACTIONS_LIST.map((action) => (
            <View key={action.id} className="w-full md:w-auto md:min-w-0 md:flex-1">
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

      <ActivityFeed userId={userId} onViewAll={() => onSelectTab("history")} />
    </View>
  );
}
