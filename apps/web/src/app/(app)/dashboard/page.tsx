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
import { layout } from "@/lib/constants/layout";

type DashboardData = {
  profile: Profile | null;
  books: LibraryBookRow[];
  readingGoal: ReadingGoalStatus;
  userId: string;
};

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

  if (user === undefined || (user && data === null && !loadError)) {
    return <LoadingState message="Loading dashboard…" />;
  }

  if (!user) {
    return null;
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
    : "/search/";

  const greetingName = profile?.display_name || profile?.username;

  return (
    <div className={`${layout.pageStackWide} space-y-10`}>
      <header className="-mx-4 feed-header-gradient px-4 pb-8 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Your dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold text-puce-red sm:text-4xl">
          What should you read today?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-text-muted">
          {greetingName
            ? `Hello, ${greetingName} — pick up where you left off or discover something new.`
            : "Pick up where you left off or discover something new."}
        </p>
      </header>

      <DashboardCard title="Currently reading">
        <CurrentlyReadingRow items={currentlyReading} onItemsChange={loadDashboard} />
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Reading goal">
          <ReadingGoalPanel
            status={readingGoal}
            variant="compact"
            onSaved={() => void loadDashboard()}
          />
        </DashboardCard>

        <DashboardCard title="Quick actions">
          <div className="mx-auto grid max-w-md gap-2 sm:grid-cols-2">
            <ButtonLink href="/search/" variant="secondary" size="sm">
              Search books
            </ButtonLink>
            <ButtonLink href={continueReadingHref} variant="primary" size="sm">
              Continue reading
            </ButtonLink>
            <ButtonLink href="/library/" variant="outline" size="sm">
              Open library
            </ButtonLink>
            <ButtonLink href="/reading-room/" variant="ghost" size="sm">
              Reading room
            </ButtonLink>
          </div>
        </DashboardCard>
      </div>

      <ActivityFeed userId={userId} />
    </div>
  );
}
