import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { formatActivityMessage } from "../../services/activity";
import { supabase } from "../../services/supabase";
import { SectionCard } from "../SectionCard";

type ActivityEvent = {
  event_type: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
};

export function ActivityFeed({ userId }: { userId: string }) {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    void supabase
      .from("activity_events")
      .select("event_type, metadata_json, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }: { data: ActivityEvent[] | null }) => setEvents(data ?? []));
  }, [userId]);

  if (!events) {
    return (
      <SectionCard title="Recent activity" emoji="📋">
        <Text className="text-sm text-ink-muted">Loading activity…</Text>
      </SectionCard>
    );
  }

  if (!events.length) {
    return (
      <SectionCard title="Recent activity" emoji="📋">
        <Text className="text-sm text-ink-muted">
          Your reading activity will show up here as you add books, track progress, and write
          reviews.
        </Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent activity" emoji="📋">
      <View className="gap-3">
        {events.map((event, index) => (
          <View
            key={`${event.created_at}-${index}`}
            className="rounded-xl border border-brand-border bg-background/70 px-4 py-3"
          >
            <Text className="text-center text-sm text-ink">
              {formatActivityMessage(event.event_type, event.metadata_json)}
            </Text>
            <Text className="mt-1 text-center text-xs text-ink-muted">
              {new Date(event.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}
