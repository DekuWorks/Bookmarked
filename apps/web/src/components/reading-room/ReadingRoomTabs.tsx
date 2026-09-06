"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { ReadingActivityPanel } from "@/components/analytics/ReadingActivityPanel";
import { AiInsightsPanel } from "@/components/premium/AiInsightsPanel";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import { NotesPanel } from "@/components/reading-room/NotesPanel";
import { OverviewTab } from "@/components/reading-room/OverviewTab";
import { ReadingCalendar } from "@/components/calendar/ReadingCalendar";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { TrailPanel } from "@/components/reading-room/TrailPanel";
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
  const libraryBooks = useMemo(
    () => data.shelves.flatMap((shelf) => shelf.items),
    [data.shelves]
  );

  const loadSessions = useCallback(async () => {
    const rows = await listUserReadingSessions(userId);
    setSessions(rows);
  }, [userId]);

  const loadReviews = useCallback(async () => {
    const rows = await listUserReviews(userId);
    setReviews(rows);
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
        className="pill-tabs reading-room-tablist"
        role="tablist"
        aria-label="Reading room sections"
      >
        {READING_ROOM_TAB_OPTIONS.map((option) => (
          <Link
            key={option.id}
            href={readingRoomTabHref(option.id)}
            role="tab"
            aria-selected={tab === option.id}
            id={`reading-room-tab-${option.id}`}
            aria-controls="reading-room-panel"
            data-active={tab === option.id ? "true" : "false"}
            className="pill-tab"
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div
        id="reading-room-panel"
        role="tabpanel"
        aria-labelledby={`reading-room-tab-${tab}`}
        aria-label={READING_ROOM_TAB_OPTIONS.find((t) => t.id === tab)?.label}
      >
        {tab === "overview" ? (
          <OverviewTab
            userId={userId}
            data={{
              currentlyReading: data.currentlyReading,
              recentlyFinished: data.recentlyFinished,
              favorites: data.favorites,
            }}
            onRefresh={onRefresh}
          />
        ) : null}

        {tab === "progress" ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Reading Goal</h2>
              <div className="mt-4">
                <ReadingGoalPanel
                  status={data.readingGoal}
                  onSaved={() => void onRefresh()}
                />
              </div>
              <p className="mt-4 text-center">
                <Link href="/wrapped/" className="text-sm font-semibold text-primary hover:underline">
                  Your year in books
                </Link>
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <ReadingCalendar userId={userId} />
            </section>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Reading Statistics</h2>
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
              <h2 className="text-lg font-semibold text-puce-red">AI Insights</h2>
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

        {tab === "trail" ? <TrailPanel sessions={sessions} /> : null}

        {tab === "notes" ? <NotesPanel userId={userId} /> : null}

        {tab === "reviews" ? (
          <ReviewsPanel reviews={reviews} onReviewsChange={() => void loadReviews()} />
        ) : null}

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
