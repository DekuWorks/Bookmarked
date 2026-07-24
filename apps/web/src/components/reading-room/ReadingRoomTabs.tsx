"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { ReadingActivityPanel } from "@/components/analytics/ReadingActivityPanel";
import { AiInsightsPanel } from "@/components/premium/AiInsightsPanel";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import { NotesSearchForm } from "@/components/notes/NotesSearchForm";
import { NotesSearchResultCard } from "@/components/notes/NotesSearchResultCard";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TrailPanel } from "@/components/reading-room/TrailPanel";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { bookDetailsPath } from "@/lib/routes/book";
import { searchNotesWithBooks } from "@/lib/services/readingNotes";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import { listUserReviews, type UserReviewWithBook } from "@/lib/services/readingRoom";
import {
  listUserReadingSessions,
  type UserReadingSession,
} from "@/lib/services/readingSessions";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  parseReadingRoomTab,
  READING_ROOM_TAB_OPTIONS,
  readingRoomTabHref,
  type ReadingRoomTab,
} from "@/lib/reading-room/readingRoomTabs";

export type { ReadingRoomTab };

const ReviewsPanel = dynamic(
  () => import("@/components/reading-room/ReviewsPanel").then((m) => ({ default: m.ReviewsPanel })),
  { loading: () => <LoadingState message="Loading reviews…" /> }
);

const HistoryPanel = dynamic(
  () => import("@/components/reading-room/HistoryPanel").then((m) => ({ default: m.HistoryPanel })),
  { loading: () => <LoadingState message="Loading history…" /> }
);

type Props = {
  userId: string;
  data: ReadingRoomData;
  onRefresh: () => void;
};

function ReadingRoomTabsContent({ userId, data, onRefresh }: Props) {
  const searchParams = useSearchParams();
  const tab = parseReadingRoomTab(searchParams.get("tab"));
  const { canAccess, loading: subscriptionLoading } = useSubscription(userId);
  const hasAdvancedAnalytics = canAccess("advanced_analytics");
  const hasAiInsights = canAccess("ai_insights");
  const [sessions, setSessions] = useState<UserReadingSession[] | null>(null);
  const [reviews, setReviews] = useState<UserReviewWithBook[] | null>(null);
  const [recentNotes, setRecentNotes] = useState<
    Awaited<ReturnType<typeof searchNotesWithBooks>>["notes"] | null
  >(null);
  const libraryBooks = useMemo(
    () => data.shelves.flatMap((shelf) => shelf.items),
    [data.shelves]
  );

  const continueReadingBook = data.currentlyReading.find((b) => b.books?.id);
  const continueReadingHref = continueReadingBook?.books?.id
    ? bookDetailsPath(continueReadingBook.books.id)
    : "/search/";

  const loadSessions = useCallback(async () => {
    const rows = await listUserReadingSessions(userId);
    setSessions(rows);
  }, [userId]);

  const loadReviews = useCallback(async () => {
    const rows = await listUserReviews(userId);
    setReviews(rows);
  }, [userId]);

  const loadNotes = useCallback(async () => {
    const { notes } = await searchNotesWithBooks({ userId, limit: 12 });
    setRecentNotes(notes);
  }, [userId]);

  useEffect(() => {
    if (tab === "trail" || tab === "history") {
      void loadSessions();
    }
  }, [tab, loadSessions]);

  useEffect(() => {
    if (tab === "reviews") {
      void loadReviews();
    }
  }, [tab, loadReviews]);

  useEffect(() => {
    if (tab === "notes") {
      void loadNotes();
    }
  }, [tab, loadNotes]);

  useEffect(() => {
    if (tab !== "progress" || typeof window === "undefined") return;

    const scrollToHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const target = document.getElementById(hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const frame = window.requestAnimationFrame(scrollToHash);
    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

  return (
    <div className="space-y-6">
      <div
        className="pill-tabs overflow-x-auto"
        role="tablist"
        aria-label="Reading room sections"
      >
        {READING_ROOM_TAB_OPTIONS.map((option) => (
          <Link
            key={option.id}
            href={readingRoomTabHref(option.id)}
            role="tab"
            aria-selected={tab === option.id}
            data-active={tab === option.id ? "true" : "false"}
            className="pill-tab shrink-0"
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div role="tabpanel" aria-label={READING_ROOM_TAB_OPTIONS.find((t) => t.id === tab)?.label}>
        {tab === "overview" ? (
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-puce-red">
                <ShelfIcon id="currently_reading" size="medium" />
                Currently reading
              </h2>
              <div className="mt-4">
                <CurrentlyReadingRow
                  items={data.currentlyReading}
                  onItemsChange={onRefresh}
                />
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-puce-red">
                  <ShelfIcon id="read" size="medium" />
                  Recently finished
                </h2>
                <div className="mt-4">
                  <BookMiniGrid
                    items={data.recentlyFinished}
                    emptyMessage="Finished books will appear here."
                    emptyAction={{ label: "Browse your library", href: "/library/read/" }}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold text-puce-red">Favorites</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Mark favorites on any book page
                </p>
                <div className="mt-4">
                  <BookMiniGrid
                    items={data.favorites}
                    emptyMessage="Star books from their detail page to collect favorites here."
                    emptyAction={{ label: "Find a book", href: "/search/" }}
                  />
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Quick actions</h2>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <ButtonLink href="/search/" variant="secondary" size="sm">
                  Search books
                </ButtonLink>
                <ButtonLink href={continueReadingHref} variant="primary" size="sm">
                  Continue reading
                </ButtonLink>
                <ButtonLink href="/library/" variant="outline" size="sm">
                  Open library
                </ButtonLink>
              </div>
            </section>

            <ActivityFeed userId={userId} />
          </div>
        ) : null}

        {tab === "progress" ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Reading goal</h2>
              <div className="mt-4">
                <ReadingGoalPanel
                  status={data.readingGoal}
                  onSaved={() => void onRefresh()}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Reading statistics</h2>
              <div className="mt-4">
                <AnalyticsGrid
                  analytics={data.analytics}
                  readingGoal={data.readingGoal}
                  compact
                />
              </div>
            </section>

            <section
              id="reading-activity"
              className="scroll-mt-24 rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6"
            >
              <h2 className="text-lg font-semibold text-puce-red">Activity</h2>
              <div className="mt-4">
                {subscriptionLoading ? (
                  <LoadingState message="Checking subscription…" />
                ) : hasAdvancedAnalytics ? (
                  <ReadingActivityPanel userId={userId} />
                ) : (
                  <PremiumFeatureLock
                    title="Advanced reading analytics"
                    description="Unlock reading heatmaps, pace trends, and weekly activity charts with Premium."
                    compact
                  />
                )}
              </div>
            </section>

            <section
              id="ai-insights"
              className="scroll-mt-24 rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6"
            >
              <h2 className="text-lg font-semibold text-puce-red">AI insights</h2>
              <div className="mt-4">
                {subscriptionLoading ? (
                  <LoadingState message="Checking subscription…" />
                ) : hasAiInsights ? (
                  <AiInsightsPanel userId={userId} />
                ) : (
                  <PremiumFeatureLock
                    title="AI reading insights"
                    description="Get personalized reflections and reading patterns powered by your trail."
                    compact
                  />
                )}
              </div>
            </section>
          </div>
        ) : null}

        {tab === "trail" ? (
          <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6 text-left">
            <h2 className="text-center text-lg font-semibold text-puce-red">Trail</h2>
            <p className="mt-1 text-center text-sm text-text-muted">
              Pick a book to view its session notes.
            </p>
            <TrailPanel sessions={sessions} />
          </section>
        ) : null}

        {tab === "notes" ? (
          <div className="space-y-6 text-left">
            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-center text-lg font-semibold text-puce-red">
                Search reading notes
              </h2>
              <div className="mt-4">
                <NotesSearchForm />
              </div>
              <p className="mt-4 text-center text-sm text-text-muted">
                Or open the full{" "}
                <Link href="/notes/" className="font-medium text-primary hover:underline">
                  notes search page
                </Link>
                .
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h3 className="text-center text-base font-semibold text-puce-red">Recent notes</h3>
              {recentNotes === null ? (
                <LoadingState message="Loading notes…" />
              ) : recentNotes.length === 0 ? (
                <p className="mt-4 text-center text-sm text-text-muted">
                  Add notes from any book in your library.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {recentNotes.map((note) => (
                    <li key={note.id}>
                      <NotesSearchResultCard note={note} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}

        {tab === "reviews" ? <ReviewsPanel reviews={reviews} /> : null}

        {tab === "history" ? (
          <HistoryPanel books={libraryBooks} sessions={sessions} />
        ) : null}
      </div>
    </div>
  );
}

export function ReadingRoomTabs(props: Props) {
  return (
    <Suspense fallback={<LoadingState message="Loading reading room…" />}>
      <ReadingRoomTabsContent {...props} />
    </Suspense>
  );
}
