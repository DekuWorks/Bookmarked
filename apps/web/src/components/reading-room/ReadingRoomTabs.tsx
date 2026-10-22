"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { ReadingActivityPanel } from "@/components/analytics/ReadingActivityPanel";
import { AiCompanionPanel } from "@/components/premium/AiCompanionPanel";
import { AiInsightsPanel } from "@/components/premium/AiInsightsPanel";
import { PlusInsightsPanel } from "@/components/premium/PlusInsightsPanel";
import { PlusBadge } from "@/components/premium/PlusBadge";
import { PlusLockedFeature } from "@/components/premium/PlusLockedFeature";
import { NotesPanel } from "@/components/reading-room/NotesPanel";
import { OverviewTab } from "@/components/reading-room/OverviewTab";
import { ReadingCalendar } from "@/components/calendar/ReadingCalendar";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import { listUserReviews, type UserReviewWithBook } from "@/lib/services/readingRoom";
import {
  listUserReadingSessions,
  type UserReadingSession,
} from "@/lib/services/readingSessions";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { StatsSectionSkeleton } from "@/components/reading-room/StatsSectionSkeleton";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  READING_ROOM_TAB_OPTIONS,
  readingRoomTabHref,
  type ReadingRoomTab,
} from "@/lib/reading-room/readingRoomTabs";
import { STATS_PLUS_FEATURES } from "@bookmarked/utils/plusLockedCopy";
import { legacyTrailLocation } from "@bookmarked/utils/bookTrail";
import {
  legacyProgressLocation,
  readingRoomTabLabel,
  resolveReadingRoomDestination,
} from "@bookmarked/utils/readingRoomTabs";

export type { ReadingRoomTab };

function subscribeLocation(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function currentLocationHash(): string {
  return window.location.hash.replace(/^#/, "");
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const locationHash = useSyncExternalStore(subscribeLocation, currentLocationHash, () => "");
  const tab = resolveReadingRoomDestination(rawTab, locationHash);
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
    const legacy = legacyTrailLocation({
      tab: rawTab,
      bookId: searchParams.get("book") ?? searchParams.get("bookId"),
      platform: "web",
    });
    if (!legacy) return;
    router.replace(legacy.href);
  }, [rawTab, router, searchParams]);

  useEffect(() => {
    if (tab === "history") {
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
    let scrollHash = locationHash;
    if (rawTab === "progress") {
      const next = legacyProgressLocation(rawTab, locationHash);
      if (next) {
        scrollHash = next.hash;
        const url = `${readingRoomTabHref(next.tab)}${next.hash ? `#${next.hash}` : ""}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (current !== url) window.history.replaceState(null, "", url);
      }
    }
    if (!scrollHash) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(scrollHash);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [locationHash, rawTab]);

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
            <section
              id="reading-calendar"
              className="rr-stats-card min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-surface/90 p-4 shadow-sm sm:p-5 md:p-6"
            >
              <ReadingCalendar userId={userId} />
            </section>

            <section
              id="reading-statistics"
              className="rr-stats-card scroll-mt-24 rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6"
              style={{ animationDelay: "40ms" }}
            >
              <h2 className="font-display text-xl text-puce-red">Reading Statistics</h2>
              <div className="mt-4">
                <AnalyticsGrid
                  analytics={data.analytics}
                  readingGoal={data.readingGoal}
                  compact
                />
              </div>
              <p className="mt-4 text-center">
                <Link href="/wrapped/" className="text-sm font-semibold text-primary hover:underline">
                  Your year in books
                </Link>
              </p>
            </section>

            {subscriptionLoading ? (
              <section
                className="rr-stats-card rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6"
                style={{ animationDelay: "80ms" }}
              >
                <StatsSectionSkeleton label="Checking subscription" />
              </section>
            ) : (
              <>
                {hasAdvancedAnalytics ? (
                  <section
                    id="reading-activity"
                    className="rr-stats-card scroll-mt-24 rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6"
                    style={{ animationDelay: "80ms" }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="advanced-reading-analytics-heading" className="font-display text-xl text-puce-red">
                        {STATS_PLUS_FEATURES.analytics.title}
                      </h2>
                      <PlusBadge />
                    </div>
                    <div className="mt-4 space-y-8">
                      <ReadingActivityPanel userId={userId} />
                      <PlusInsightsPanel userId={userId} />
                    </div>
                  </section>
                ) : (
                  <div id="reading-activity" className="rr-stats-card scroll-mt-24" style={{ animationDelay: "80ms" }}>
                    <PlusLockedFeature
                      title={STATS_PLUS_FEATURES.analytics.title}
                      description={STATS_PLUS_FEATURES.analytics.description}
                      headingId="advanced-reading-analytics-heading"
                    />
                  </div>
                )}

                {hasAiInsights ? (
                  <section
                    id="ai-insights"
                    className="rr-stats-card scroll-mt-24 rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6"
                    style={{ animationDelay: "120ms" }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="ai-insights-heading" className="font-display text-xl text-puce-red">
                        {STATS_PLUS_FEATURES.insights.title}
                      </h2>
                      <PlusBadge />
                    </div>
                    <div className="mt-4 space-y-6">
                      <AiInsightsPanel userId={userId} />
                      <AiCompanionPanel />
                    </div>
                  </section>
                ) : (
                  <div id="ai-insights" className="rr-stats-card scroll-mt-24" style={{ animationDelay: "120ms" }}>
                    <PlusLockedFeature
                      title={STATS_PLUS_FEATURES.insights.title}
                      description={STATS_PLUS_FEATURES.insights.description}
                      headingId="ai-insights-heading"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}

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
