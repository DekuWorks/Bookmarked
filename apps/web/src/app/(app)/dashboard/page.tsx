"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks } from "@/lib/services/library";
import { computeReadingAnalytics } from "@/lib/services/analytics";
import { fetchReadingStreakTimestamps } from "@/lib/services/readingInsights";
import { computeReadingGoal } from "@/lib/services/readingGoal";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { shelfStatusToSlug } from "@/lib/constants/shelves";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
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

export default function DashboardPage() {
  const user = useAuthUser();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    void Promise.all([
      getProfile(user.id),
      getUserLibraryBooks(user.id),
      fetchReadingStreakTimestamps(user.id),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]).then(([profile, books, streakTimestamps, reviewResult]) => {
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
    });
  }, [user]);

  if (user === undefined || (user && !data)) {
    return <LoadingState message="Loading dashboard…" />;
  }

  if (!user || !data) return null;

  const { profile, books, analytics, readingGoal, userId } = data;
  const currentlyReading = books.filter((b) => b.shelf_status === "currently_reading");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-puce-red">
            Hello{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-1 text-text-muted">@{profile?.username}</p>
        </div>
        <ButtonLink href="/reading-room" variant="secondary">
          Open Reading Room
        </ButtonLink>
      </header>

      <DashboardCard title="Currently reading">
        <CurrentlyReadingRow items={currentlyReading} />
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Reading goal">
          <ReadingGoalPanel status={readingGoal} variant="compact" />
        </DashboardCard>

        <DashboardCard title="Quick actions">
          <div className="flex flex-wrap gap-2">
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
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
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

      <DashboardCard title="Your reading at a glance">
        <AnalyticsGrid analytics={analytics} readingGoal={readingGoal} compact />
      </DashboardCard>

      <ActivityFeed userId={userId} />
    </div>
  );
}
