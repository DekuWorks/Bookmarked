"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { ReadingActivityPanel } from "@/components/analytics/ReadingActivityPanel";
import { AiCompanionPanel } from "@/components/premium/AiCompanionPanel";
import { AiInsightsPanel } from "@/components/premium/AiInsightsPanel";
import { PlusInsightsPanel } from "@/components/premium/PlusInsightsPanel";
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
import { readingRoomTabLabel } from "@bookmarked/utils/readingRoomTabs";

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
  dataSettled: boolean;
  onRefresh: () => void;
};

function ReadingRoomTabsContent({ userId, data, dataSettled, onRefresh }: Props) {
  const searchParams = useSearchParams();
  const tab = parseReadingRoomTab(searchParams.get("tab"));
  const { canAccess, loading: subscriptionLoading } = useSubscription(userId);
  const hasAdvancedAnalytics = canAccess("advanced_analytics");
  const hasAiInsights = canAccess("ai_insights");
  const [sessions, setSessions] = useState<UserReadingSession[] | null>(null);
  const [reviews, setReviews] = useState<UserReviewWithBook[] | null>(null);
  const [keepNotes, setKeepNotes] = useState(tab === "notes");
  const [keepReviews, setKeepReviews] = useState(tab === "reviews");
  if (tab === "notes" && !keepNotes) setKeepNotes(true);
  if (tab === "reviews" && !keepReviews) setKeepReviews(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstPanel = useRef(true);
  const tabIndex = READING_ROOM_TAB_OPTIONS.findIndex((option) => option.id === tab);
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
    if (firstPanel.current) {
      firstPanel.current = false;
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    panel.classList.remove("reading-room-panel-in");
    void panel.offsetWidth;
    panel.classList.add("reading-room-panel-in");
  }, [tab]);

  function onTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const current = Math.max(0, tabIndex);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next =
      READING_ROOM_TAB_OPTIONS[
        (current + direction + READING_ROOM_TAB_OPTIONS.length) % READING_ROOM_TAB_OPTIONS.length
      ];
    const link = next ? document.getElementById(`reading-room-tab-${next.id}`) : null;
    link?.focus();
    link?.click();
  }

  useEffect(() => {
    if (tab !== "stats" || typeof window === "undefined") return;

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
        onKeyDown={onTabKeyDown}
      >
        {tabIndex >= 0 ? (
          <span
            className="reading-room-tab-indicator"
            aria-hidden
            style={{ "--reading-room-tab": tabIndex } as React.CSSProperties}
          />
        ) : null}
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
        ref={panelRef}
        id="reading-room-panel"
        role="tabpanel"
        aria-labelledby={
          READING_ROOM_TAB_OPTIONS.some((option) => option.id === tab)
            ? `reading-room-tab-${tab}`
            : undefined
        }
        aria-label={readingRoomTabLabel(tab)}
      >
        <div hidden={tab !== "overview"}>
          <OverviewTab
            data={{
              currentlyReading: data.currentlyReading,
              readingGoal: data.readingGoal,
              shelves: data.shelves,
            }}
            dataSettled={dataSettled}
            onRefresh={onRefresh}
          />
        </div>

        {tab === "stats" ? (
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
                  <div className="space-y-8">
                    <ReadingActivityPanel userId={userId} />
                    <PlusInsightsPanel userId={userId} />
                  </div>
                ) : (
                  <PremiumFeatureLock
                    title="Advanced reading analytics"
                    description="Unlock reading heatmaps, pace trends, and weekly activity charts with Bookmarked Plus."
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
                  <div className="space-y-6">
                    <AiInsightsPanel userId={userId} />
                    <AiCompanionPanel />
                  </div>
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

        {keepNotes ? (
          <div hidden={tab !== "notes"}>
            <NotesPanel userId={userId} />
          </div>
        ) : null}

        {keepReviews ? (
          <div hidden={tab !== "reviews"}>
            <ReviewsPanel reviews={reviews} onReviewsChange={() => void loadReviews()} />
          </div>
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
