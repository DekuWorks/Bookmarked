"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks } from "@/lib/services/library";
import { backfillReadingSessionsForUser } from "@/lib/services/readingSessionBackfill";
import { computeReadingGoal } from "@/lib/services/readingGoal";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { LoadingState } from "@/components/ui/LoadingState";
import { bookDetailsPath } from "@/lib/routes/book";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useUserBooksRealtime } from "@/lib/hooks/useUserBooksRealtime";
import { useStaleCatalogRefresh } from "@/lib/hooks/useStaleCatalogRefresh";
import type { Profile } from "@/types";
import type { LibraryBookRow } from "@/lib/services/library";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";

type DashboardData = {
  profile: Profile | null;
  books: LibraryBookRow[];
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
      const [profile, books] = await Promise.all([
        getProfile(user.id),
        getUserLibraryBooks(user.id),
      ]);

      void backfillReadingSessionsForUser(user.id, supabase);

      setData({
        profile,
        books,
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
  useStaleCatalogRefresh(data?.books, loadDashboard);

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

  const { profile, books, readingGoal, userId } = data;
  const currentlyReading = books.filter((b) => b.shelf_status === "currently_reading");
  const continueReadingBook = books.find(
    (b) => b.shelf_status === "currently_reading" && b.books?.id
  );
  const continueReadingHref = continueReadingBook?.books?.id
    ? bookDetailsPath(continueReadingBook.books.id)
    : "/search";

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

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Reading goal">
          <ReadingGoalPanel status={readingGoal} variant="compact" />
        </DashboardCard>

        <DashboardCard title="Quick actions">
          <div className="mx-auto grid max-w-md gap-2 sm:grid-cols-2">
            <ButtonLink href="/search" variant="secondary" size="sm">
              Search books
            </ButtonLink>
            <ButtonLink href={continueReadingHref} variant="primary" size="sm">
              Continue reading
            </ButtonLink>
            <ButtonLink href="/library" variant="outline" size="sm">
              Open library
            </ButtonLink>
            <ButtonLink href="/search" variant="ghost" size="sm">
              Add book
            </ButtonLink>
          </div>
        </DashboardCard>
      </div>

      <ActivityFeed userId={userId} />
    </div>
  );
}
