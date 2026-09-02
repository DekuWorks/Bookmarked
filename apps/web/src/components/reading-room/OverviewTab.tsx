"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { OverviewBookShelf } from "@/components/reading-room/OverviewBookShelf";
import { QuickActionCard } from "@/components/reading-room/QuickActionCard";
import { ReadingRoomSection } from "@/components/reading-room/ReadingRoomSection";
import { LoadingState } from "@/components/ui/LoadingState";
import { trackProductEvent } from "@/lib/services/productAnalytics";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import { OVERVIEW_SECTION_TITLES } from "@bookmarked/utils/overviewCopy";
import { OVERVIEW_QUICK_ACTIONS_LIST } from "@bookmarked/utils/overviewQuickActions";

const ActivityFeed = dynamic(
  () => import("@/components/reading-room/ActivityFeed").then((m) => ({ default: m.ActivityFeed })),
  { loading: () => <LoadingState message="Loading activity…" /> }
);

type Props = {
  userId: string;
  data: Pick<ReadingRoomData, "currentlyReading" | "recentlyFinished" | "favorites">;
  onRefresh: () => void;
};

function DeferredSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} aria-busy={!visible}>
      {visible ? children : <LoadingState message={`Loading ${label}…`} />}
    </div>
  );
}

export function OverviewTab({ userId, data, onRefresh }: Props) {
  return (
    <div className="space-y-8 md:space-y-10">
      <ReadingRoomSection title={OVERVIEW_SECTION_TITLES.currentlyReading} shelfIconId="currently_reading">
        <CurrentlyReadingRow items={data.currentlyReading} onItemsChange={onRefresh} />
      </ReadingRoomSection>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <DeferredSection label="recently finished">
          <OverviewBookShelf
            title={OVERVIEW_SECTION_TITLES.recentlyFinished}
            shelfIconId="read"
            items={data.recentlyFinished}
            showFinishedDate
            viewAllHref="/library/read/"
            emptyMessage="Books you finish will appear here."
            emptyAction={{ label: "Browse your library", href: "/library/read/" }}
          />
        </DeferredSection>

        <DeferredSection label="favorites">
          <OverviewBookShelf
            title={OVERVIEW_SECTION_TITLES.favorites}
            items={data.favorites}
            showFavoriteBadge
            viewAllHref="/library/"
            emptyMessage="Star books from their detail page to collect favorites here."
            emptyAction={{ label: "Find a book", href: "/search/" }}
          />
        </DeferredSection>
      </div>

      <ReadingRoomSection title={OVERVIEW_SECTION_TITLES.quickActions}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {OVERVIEW_QUICK_ACTIONS_LIST.map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onNavigate={() => trackProductEvent(action.analyticsEvent)}
            />
          ))}
        </div>
      </ReadingRoomSection>

      <DeferredSection label="recent activity">
        <ActivityFeed userId={userId} />
      </DeferredSection>
    </div>
  );
}
