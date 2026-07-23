import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { LoadingState } from "../../src/components/LoadingState";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useUpcomingEvents } from "../../src/hooks/useClubEvents";
import { formatEventDateTime } from "../../src/services/clubEvents";

export default function EventsScreen() {
  const router = useRouter();
  const events = useUpcomingEvents();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Events" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-8 pt-2">
        <Text className="mb-4 text-center text-sm text-text-muted">
          Upcoming read-alongs and meetups from public clubs and clubs you belong to.
        </Text>

        {events.isLoading ? (
          <LoadingState message="Loading events…" />
        ) : !events.data?.length ? (
          <EmptyState
            title="No upcoming events"
            description="Join a book club and schedule a meetup to see it here."
            action={
              <Button title="Browse clubs" onPress={() => router.push("/(app)/clubs")} />
            }
          />
        ) : (
          <View className="gap-3">
            {events.data.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => router.push(`/(app)/clubs/${event.club.id}`)}
                className="rounded-2xl border border-border bg-surface p-4"
                accessibilityRole="button"
              >
                <Text className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {formatEventDateTime(event.starts_at)}
                </Text>
                <Text className="mt-1 text-lg font-bold text-puce-red">{event.title}</Text>
                <Text className="mt-1 text-sm text-primary">{event.club.name}</Text>
                {event.location ? (
                  <Text className="mt-2 text-sm text-text-muted">{event.location}</Text>
                ) : null}
                {event.description ? (
                  <Text className="mt-2 text-sm text-text">{event.description}</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
