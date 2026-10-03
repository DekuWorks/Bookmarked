"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatActivityMessage } from "@/lib/services/activity";
import { ReadingRoomSection } from "@/components/reading-room/ReadingRoomSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { readingRoomTabHref } from "@/lib/reading-room/readingRoomTabs";
import {
  OVERVIEW_ACTIVITY_VIEW_ALL,
  OVERVIEW_EMPTY_COPY,
  OVERVIEW_SECTION_TITLES,
  overviewContentPhase,
} from "@bookmarked/utils/overviewCopy";

type ActivityEvent = {
  event_type: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
};

export function ActivityFeed({ userId }: { userId: string }) {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    setFailed(false);
    setEvents(null);
    void supabase
      .from("activity_events")
      .select("event_type, metadata_json, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setFailed(true);
          setEvents([]);
          return;
        }
        setEvents(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const sectionAction = (
    <Link
      href={readingRoomTabHref("history")}
      className="inline-flex min-h-[44px] items-center justify-center text-center text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
    >
      {OVERVIEW_ACTIVITY_VIEW_ALL}
    </Link>
  );

  const phase = failed ? "error" : overviewContentPhase(events === null, events?.length ?? 0);

  if (phase === "loading") {
    return (
      <ReadingRoomSection
        title={OVERVIEW_SECTION_TITLES.recentActivity}
        action={sectionAction}
        actionLayout="stacked"
      >
        <div className="mx-auto max-w-2xl space-y-3" role="status" aria-label={OVERVIEW_EMPTY_COPY.activityLoading}>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </ReadingRoomSection>
    );
  }

  if (phase === "error" || phase === "empty") {
    return (
      <ReadingRoomSection
        title={OVERVIEW_SECTION_TITLES.recentActivity}
        action={sectionAction}
        actionLayout="stacked"
      >
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
          {phase === "error" ? OVERVIEW_EMPTY_COPY.activityError : OVERVIEW_EMPTY_COPY.recentActivity}
        </p>
      </ReadingRoomSection>
    );
  }

  return (
    <ReadingRoomSection
      title={OVERVIEW_SECTION_TITLES.recentActivity}
      action={sectionAction}
      actionLayout="stacked"
    >
      <ul className="mx-auto max-w-2xl space-y-3" aria-label="Recent reading activity">
        {(events ?? []).map((event, i) => (
          <li
            key={`${event.created_at}-${i}`}
            className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm"
          >
            <p className="text-left text-text">
              {formatActivityMessage(event.event_type, event.metadata_json)}
            </p>
            <p className="mt-0.5 text-left text-xs text-text-muted">
              <time suppressHydrationWarning dateTime={event.created_at}>
                {new Date(event.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </p>
          </li>
        ))}
      </ul>
    </ReadingRoomSection>
  );
}
