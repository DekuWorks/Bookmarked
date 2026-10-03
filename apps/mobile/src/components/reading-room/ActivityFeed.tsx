import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { formatActivityMessage } from "../../services/activity";
import { supabase } from "../../services/supabase";
import { SectionCard } from "../SectionCard";
import {
  OVERVIEW_ACTIVITY_VIEW_ALL,
  OVERVIEW_EMPTY_COPY,
  OVERVIEW_SECTION_TITLES,
  overviewContentPhase,
} from "../../../../../packages/utils/overviewCopy";

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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
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

  const phase = failed ? "error" : overviewContentPhase(events === null, events?.length ?? 0);

  return (
    <SectionCard
      title={OVERVIEW_SECTION_TITLES.recentActivity}
      actionLayout="stacked"
      headerAlign="center"
      action={
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          accessibilityLabel={OVERVIEW_ACTIVITY_VIEW_ALL}
          className="min-h-[44px] items-center justify-center"
        >
          <Text className="text-center text-sm text-primary-dark">{OVERVIEW_ACTIVITY_VIEW_ALL}</Text>
        </Pressable>
      }
    >
      {phase === "loading" ? (
        <Text className="text-center text-sm text-ink-muted" accessibilityRole="text">
          {OVERVIEW_EMPTY_COPY.activityLoading}
        </Text>
      ) : phase === "error" || phase === "empty" ? (
        <Text className="text-center text-sm text-ink-muted">
          {phase === "error" ? OVERVIEW_EMPTY_COPY.activityError : OVERVIEW_EMPTY_COPY.recentActivity}
        </Text>
      ) : (
        <View className="gap-3" accessibilityLabel="Recent reading activity">
          {(events ?? []).map((event, index) => (
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
