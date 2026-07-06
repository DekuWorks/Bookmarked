"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks } from "@/lib/services/library";
import { computeReadingAnalytics } from "@/lib/services/analytics";
import { fetchReadingStreakTimestamps } from "@/lib/services/readingInsights";
import { backfillReadingSessionsForUser } from "@/lib/services/readingSessionBackfill";
import { computeReadingGoal } from "@/lib/services/readingGoal";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ReadingActivityPanel } from "@/components/analytics/ReadingActivityPanel";
import { SuggestedShelvesPanel } from "@/components/shelves/SuggestedShelvesPanel";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { shelfStatusToSlug } from "@/lib/constants/shelves";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useUserBooksRealtime } from "@/lib/hooks/useUserBooksRealtime";
import type { Profile } from "@/types";
import type { LibraryBookRow } from "@/lib/services/library";
import type { ReadingAnalytics } from "@/lib/services/analytics";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";
import type { ShelfStatus } from "@/types";

const QUICK_SHELVES: ShelfStatus[] = ["want_to_read", "currently_reading", "read"];

type DashboardData = {
  profile: Profile | null;
  books: LibraryBookRow[];
  analytics: ReadingAnalytics;
  readingGoal: ReadingGoalStatus;
  userId: string;
};

import { layout } from "@/lib/constants/layout";

export default function DashboardPage() {
  const user = useAuthUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    setLoadError(null);

    const supabase = createClient();
    try {
      const [profile, books, streakTimestamps, reviewResult] = await Promise.all([
        getProfile(user.id),
        getUserLibraryBooks(user.id),
        fetchReadingStreakTimestamps(user.id),
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      void backfillReadingSessionsForUser(user.id, supabase);

      const analytics = computeReadingAnalytics({
        books,
        reviewsWritten: reviewResult.count ?? 0,
        streakTimestamps,
        profileGenres: profile?.favorite_genres,
      });
      setData({
        profile,
        books,
        analytics,
        readingGoal: computeReadingGoal(books, profile?.yearly_reading_goal ?? null),
        userId: user.id,
      });
    } catch (error) {
      console.error("[dashboard] load failed:", error);
      setLoadError("Could not load your dashboard. Please refresh and try again.");
    }
  }, [user]);

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      setData(null);
      setLoadError(null);
      return;
    }

    setData(null);
    void loadDashboard();
  }, [user, loadDashboard]);

  useUserBooksRealtime(user?.id, loadDashboard);

  if (user === undefined || user === null || (data === null && !loadError)) {
    return <LoadingState message="Loading dashboard…" />;
  }

  if (loadError) {
    return (
      <div className={`${layout.pageStackWide} text-center`}>
        <p className="text-rust">{loadError}</p>
      </div>
    );
  }

  if (!data) {
    return <LoadingState message="Loading dashboard…" />;
  }

  const { profile, books, analytics, readingGoal, userId } = data;
  const currentlyReading = books.filter((b) => b.shelf_status === "currently_reading");

  return (
    <div className={layout.pageStackWide}>
      <header className="flex flex-col items-center gap-4 text-center">
        <div>
          <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">
            Hello{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-1 text-text-muted">@{profile?.username}</p>
        </div>
        <ButtonLink href="/reading-room" variant="secondary">
          Open Reading Room
        </ButtonLink>
      </header>

      <DashboardCard title="Currently reading">
        <CurrentlyReadingRow items={currentlyReading} onItemsChange={loadDashboard} />
      </DashboardCard>

      <SuggestedShelvesPanel userId={userId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Reading goal">
          <ReadingGoalPanel status={readingGoal} variant="compact" />
        </DashboardCard>

        <DashboardCard title="Quick actions">
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_SHELVES.map((status) => (
              <Link
                key={status}
                href={`/library/${shelfStatusToSlug(status)}`}
                className="inline-flex min-h-[44px] items-center rounded-lg transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
              >
                <ShelfBadge status={status} />
              </Link>
            ))}
          </div>
          <div className="mx-auto mt-4 grid max-w-md gap-2 sm:grid-cols-2">
            <ButtonLink href="/search" variant="secondary" size="sm">
              Search books
            </ButtonLink>
            <ButtonLink href="/library" variant="outline" size="sm">
              Open library
            </ButtonLink>
            <ButtonLink href="/reading-room" variant="primary" size="sm">
              Reading Room
            </ButtonLink>
            <ButtonLink href="/library/want-to-read" variant="ghost" size="sm">
              Want to read
            </ButtonLink>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Reading activity">
        <ReadingActivityPanel userId={userId} />
      </DashboardCard>

      <DashboardCard title="Your reading at a glance">
        <AnalyticsGrid analytics={analytics} readingGoal={readingGoal} compact />
      </DashboardCard>

      <ActivityFeed userId={userId} />
    </div>
  );
}
