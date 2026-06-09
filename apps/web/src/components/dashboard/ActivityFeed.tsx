"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatActivityMessage } from "@/lib/services/activity";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

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

  if (!events) {
    return (
      <DashboardCard title="Recent activity">
        <p className="text-sm text-text-muted">Loading activity…</p>
      </DashboardCard>
    );
  }

  if (!events.length) {
    return (
      <DashboardCard title="Recent activity">
        <p className="text-sm text-text-muted">
          Your reading activity will show up here as you add books, track progress, and
          write reviews.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Recent activity">
      <ul className="space-y-3">
        {events.map((event, i) => (
          <li
            key={`${event.created_at}-${i}`}
            className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm"
          >
            <span className="mt-0.5 text-royal-orange" aria-hidden>
              •
            </span>
            <div>
              <p className="text-text">
                {formatActivityMessage(event.event_type, event.metadata_json)}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                <time suppressHydrationWarning dateTime={event.created_at}>
                  {new Date(event.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
