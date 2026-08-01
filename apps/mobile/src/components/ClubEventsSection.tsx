import { useState } from "react";
import { Alert, Linking, Pressable, Text, TextInput, View } from "react-native";
import { Button } from "./Button";
import { Input } from "./Input";
import { LoadingState } from "./LoadingState";
import {
  useClubEvents,
  useCreateClubEvent,
  useDeleteClubEvent,
} from "../hooks/useClubEvents";
import {
  defaultEventDatetimeInput,
  formatEventDateTime,
  parseEventDatetime,
} from "../services/clubEvents";
import type { BookClubEvent } from "../types";

type Props = {
  clubId: string;
  isMember: boolean;
  viewerId: string;
  clubOwnerId: string;
};

export function ClubEventsSection({ clubId, isMember, viewerId, clubOwnerId }: Props) {
  const events = useClubEvents(clubId);
  const createMutation = useCreateClubEvent(clubId);
  const deleteMutation = useDeleteClubEvent(clubId);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(defaultEventDatetimeInput);
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [description, setDescription] = useState("");

  function canDelete(event: BookClubEvent): boolean {
    return event.created_by === viewerId || clubOwnerId === viewerId;
  }

  function handleDelete(eventId: string) {
    Alert.alert("Delete event?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(eventId, {
            onError: (err) => {
              Alert.alert("Error", err instanceof Error ? err.message : "Could not delete event.");
            },
          });
        },
      },
    ]);
  }

  function handleCreate() {
    try {
      createMutation.mutate(
        {
          title,
          location: location || null,
          meetingUrl: meetingUrl || null,
          description: description || null,
          startsAt: parseEventDatetime(startsAt),
        },
        {
          onSuccess: () => {
            setTitle("");
            setLocation("");
            setMeetingUrl("");
            setDescription("");
            setStartsAt(defaultEventDatetimeInput());
            setShowForm(false);
          },
          onError: (err) => {
            Alert.alert("Error", err instanceof Error ? err.message : "Could not create event.");
          },
        }
      );
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Invalid date and time.");
    }
  }

  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-puce-red">Upcoming events</Text>
        {isMember ? (
          <Pressable onPress={() => setShowForm((open) => !open)} accessibilityRole="button">
            <Text className="text-sm font-medium text-primary">
              {showForm ? "Cancel" : "Add event"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {isMember && showForm ? (
        <View className="mb-4 gap-3 rounded-xl border border-border bg-background p-3">
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Monthly read-along" />
          <View>
            <Text className="mb-1 text-sm font-medium text-puce-red">Date & time</Text>
            <TextInput
              value={startsAt}
              onChangeText={setStartsAt}
              placeholder="2026-07-25T19:00"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-base text-text"
            />
          </View>
          <Input
            label="Location (optional)"
            value={location}
            onChangeText={setLocation}
            placeholder="Zoom, bookstore, etc."
          />
          <Input
            label="Video call link (optional)"
            value={meetingUrl}
            onChangeText={setMeetingUrl}
            placeholder="https://zoom.us/j/... or Meet link"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View>
            <Text className="mb-1 text-sm font-medium text-puce-red">Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              className="min-h-[80px] rounded-xl border border-border bg-surface px-3 py-2.5 text-base text-text"
              placeholder="What to bring, chapters to read…"
            />
          </View>
          <Button
            title={createMutation.isPending ? "Saving…" : "Schedule event"}
            onPress={handleCreate}
            disabled={createMutation.isPending || !title.trim()}
          />
        </View>
      ) : null}

      {events.isLoading ? (
        <LoadingState message="Loading events…" />
      ) : !events.data?.length ? (
        <Text className="text-sm text-text-muted">
          {isMember
            ? "No upcoming events. Schedule a meetup or read-along for the club."
            : "This club has no upcoming events scheduled."}
        </Text>
      ) : (
        <View className="gap-3">
          {events.data.map((event) => (
            <View key={event.id} className="rounded-xl border border-border bg-background p-3">
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">
                  <Text className="font-semibold text-puce-red">{event.title}</Text>
                  <Text className="mt-1 text-sm text-text-muted">
                    {formatEventDateTime(event.starts_at)}
                  </Text>
                  {event.location ? (
                    <Text className="mt-1 text-sm text-text-muted">{event.location}</Text>
                  ) : null}
                  {event.meeting_url ? (
                    <Pressable
                      onPress={() => void Linking.openURL(event.meeting_url!)}
                      accessibilityRole="link"
                      className="mt-2 self-start"
                    >
                      <Text className="text-sm font-semibold text-primary">Join video call ↗</Text>
                    </Pressable>
                  ) : null}
                  {event.description ? (
                    <Text className="mt-2 text-sm text-text">{event.description}</Text>
                  ) : null}
                </View>
                {canDelete(event) ? (
                  <Pressable onPress={() => handleDelete(event.id)} accessibilityRole="button">
                    <Text className="text-xs text-text-muted">Delete</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
