"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatActivityMessage } from "@/lib/services/activity";
import { ReadingRoomSection } from "@/components/reading-room/ReadingRoomSection";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { readingRoomTabHref } from "@/lib/reading-room/readingRoomTabs";

type ActivityEvent = {
  event_type: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
};

export function ActivityFeed({ userId }: { userId: string }) {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("activity_events")
      .select("event_type, metadata_json, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setEvents(data ?? []));
  }, [userId]);

  const sectionAction = (
    <ButtonLink href={readingRoomTabHref("history")} variant="ghost" size="sm" className="shrink-0">
      View all activity
    </ButtonLink>
  );

  if (!events) {
    return (
      <ReadingRoomSection title="Recent activity" action={sectionAction}>
        <p className="text-center text-sm text-text-muted" role="status">
          Loading activity…
        </p>
      </ReadingRoomSection>
    );
  }

  if (!events.length) {
    return (
      <ReadingRoomSection title="Recent activity" action={sectionAction}>
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
          Your reading activity will show up here as you add books, track progress, and write
          reviews.
        </p>
      </ReadingRoomSection>
    );
  }

  return (
    <ReadingRoomSection title="Recent activity" action={sectionAction}>
      <ul className="mx-auto max-w-2xl space-y-3" aria-label="Recent reading activity">
        {events.map((event, i) => (
          <li
            key={`${event.created_at}-${i}`}
            className="rounded-xl border border-border bg-background px-4 py-3 text-center text-sm"
          >
            <p className="text-text">
              {formatActivityMessage(event.event_type, event.metadata_json)}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
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
