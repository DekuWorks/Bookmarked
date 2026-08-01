import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { formatActivityMessage } from "../../services/activity";
import { supabase } from "../../services/supabase";
import { SectionCard } from "../SectionCard";

type ActivityEvent = {
  event_type: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
};

type Props = {
  userId: string;
  onViewAll: () => void;
};

export function ActivityFeed({ userId, onViewAll }: Props) {
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

  return (
    <SectionCard
      title="Recent activity"
      emoji="📋"
      action={
        <Pressable onPress={onViewAll} accessibilityRole="button">
          <Text className="text-sm font-semibold text-primary-dark">View all activity</Text>
        </Pressable>
      }
    >
      {!events ? (
        <Text className="text-sm text-ink-muted" accessibilityRole="text">
          Loading activity…
        </Text>
      ) : events.length === 0 ? (
        <Text className="text-sm text-ink-muted">
          Your reading activity will show up here as you add books, track progress, and write
          reviews.
        </Text>
      ) : (
        <View className="gap-3" accessibilityLabel="Recent reading activity">
          {events.map((event, index) => (
            <View
              key={`${event.created_at}-${index}`}
              className="rounded-xl border border-brand-border bg-background/70 px-4 py-3"
            >
              <Text className="text-left text-sm text-ink">
                {formatActivityMessage(event.event_type, event.metadata_json)}
              </Text>
              <Text className="mt-1 text-left text-xs text-ink-muted">
                {new Date(event.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}
