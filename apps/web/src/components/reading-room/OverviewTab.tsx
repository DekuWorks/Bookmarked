"use client";

import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { OverviewBookShelf } from "@/components/reading-room/OverviewBookShelf";
import { QuickActionCard } from "@/components/reading-room/QuickActionCard";
import { ActivityFeed } from "@/components/reading-room/ActivityFeed";
import { ReadingRoomSection } from "@/components/reading-room/ReadingRoomSection";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { trackProductEvent } from "@/lib/services/productAnalytics";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import {
  FAVORITES_LISTING,
  OVERVIEW_EMPTY_COPY,
  OVERVIEW_SECTION_TITLES,
  OVERVIEW_SHELF_ACTIONS,
} from "@bookmarked/utils/overviewCopy";
import { OVERVIEW_QUICK_ACTIONS_LIST } from "@bookmarked/utils/overviewQuickActions";
import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";

type Props = {
  userId: string;
  data: Pick<ReadingRoomData, "currentlyReading" | "recentlyFinished" | "favorites">;
  onRefresh: () => void;
};

export function OverviewTab({ userId, data, onRefresh }: Props) {
  return (
    <div className="space-y-8">
      <ReadingRoomSection
        title={OVERVIEW_SECTION_TITLES.currentlyReading}
        shelfIconId="currently_reading"
        action={
          <ButtonLink
            href={withOriginQuery("/library/reading/", { origin: "home_overview" })}
            variant="ghost"
            size="sm"
          >
            {OVERVIEW_SHELF_ACTIONS.viewShelf}
          </ButtonLink>
        }
      >
        <CurrentlyReadingRow items={data.currentlyReading} onItemsChange={onRefresh} />
      </ReadingRoomSection>

      <div className="grid items-start gap-8 md:grid-cols-2">
        <OverviewBookShelf
          title={OVERVIEW_SECTION_TITLES.recentlyFinished}
          shelfIconId="read"
          items={data.recentlyFinished}
          showFinishedDate
          viewAllHref={withOriginQuery("/library/read/", { origin: "home_overview" })}
          viewAllLabel={OVERVIEW_SHELF_ACTIONS.viewShelf}
          emptyMessage={OVERVIEW_EMPTY_COPY.recentlyFinished}
        />

        <OverviewBookShelf
          title={OVERVIEW_SECTION_TITLES.favorites}
          items={data.favorites}
          showFavoriteBadge
          viewAllHref={withOriginQuery(FAVORITES_LISTING.webPath, { origin: "home_overview" })}
          viewAllLabel={OVERVIEW_SHELF_ACTIONS.viewAll}
          emptyMessage={FAVORITES_LISTING.empty}
          emptyAction={{ label: "Find a book", href: "/search/" }}
        />
      </div>

      <ReadingRoomSection title={OVERVIEW_SECTION_TITLES.quickActions}>
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-3">
          {OVERVIEW_QUICK_ACTIONS_LIST.map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onNavigate={() => trackProductEvent(action.analyticsEvent)}
            />
          ))}
        </div>
      </ReadingRoomSection>

      <ActivityFeed userId={userId} />
    </div>
  );
}
