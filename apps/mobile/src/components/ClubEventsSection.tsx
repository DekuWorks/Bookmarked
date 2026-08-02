import { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { ClubCalendar, eventsForDayKey, monthRangeIso } from "./ClubCalendar";
import { Button } from "./Button";
import { Input } from "./Input";
import { LoadingState } from "./LoadingState";
import { SegmentedTabs } from "./SegmentedTabs";
import {
  useClubEvents,
  useClubEventsInRange,
  useCreateClubEvent,
  useDeleteClubEvent,
  useEventRsvps,
  useSetEventRsvp,
  useUpdateClubEvent,
} from "../hooks/useClubEvents";
import {
  defaultEventDatetimeInput,
  formatEventDateTime,
  parseEventDatetime,
} from "../services/clubEvents";
import type { BookClubEvent, BookClubEventType, BookClubRsvpStatus } from "../types";
import { canManageEvents } from "../../../../packages/utils/clubPermissions";
import type { BookClubMemberRole } from "../types";

type ScheduleView = "list" | "calendar";

type Props = {
  clubId: string;
  isMember: boolean;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  previewLimit?: number;
};

const RSVP_OPTIONS: { id: BookClubRsvpStatus; label: string }[] = [
  { id: "going", label: "Going" },
  { id: "maybe", label: "Maybe" },
  { id: "not_going", label: "Not going" },
];

const EVENT_TYPES: { id: BookClubEventType; label: string }[] = [
  { id: "meeting", label: "Meeting" },
  { id: "discussion", label: "Discussion" },
  { id: "reading_deadline", label: "Deadline" },
  { id: "readathon", label: "Readathon" },
  { id: "other", label: "Other" },
];

function EventRsvpRow({
  clubId,
  eventId,
  viewerId,
  enabled,
}: {
  clubId: string;
  eventId: string;
  viewerId: string;
  enabled: boolean;
}) {
  const rsvps = useEventRsvps(eventId);
  const setRsvp = useSetEventRsvp(clubId);
  const mine = (rsvps.data ?? []).find((row) => row.user_id === viewerId)?.rsvp_status;

  if (!enabled) return null;

  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {RSVP_OPTIONS.map((option) => {
        const active = mine === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`RSVP ${option.label}`}
            disabled={setRsvp.isPending}
            onPress={() =>
              void setRsvp.mutateAsync({ eventId, rsvpStatus: option.id }).catch((err) => {
                Alert.alert(
                  "Couldn't update RSVP",
                  err instanceof Error ? err.message : "Please try again."
                );
              })
            }
            className={`min-h-[44px] justify-center rounded-full px-3 ${
              active ? "bg-puce-red" : "bg-primary/15"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${active ? "text-white" : "text-puce-red"}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ClubEventsSection({
  clubId,
  isMember,
  viewerId,
  viewerRole,
  previewLimit,
}: Props) {
  const canManage = canManageEvents(viewerRole) || isMember;
  const listEvents = useClubEvents(clubId, { includePast: true, limit: 50 });
  const [view, setView] = useState<ScheduleView>("list");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const range = useMemo(() => monthRangeIso(month), [month]);
  const monthEvents = useClubEventsInRange(clubId, range.startIso, range.endIso);

  const createMutation = useCreateClubEvent(clubId);
  const updateMutation = useUpdateClubEvent(clubId);
  const deleteMutation = useDeleteClubEvent(clubId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(defaultEventDatetimeInput);
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<BookClubEventType>("meeting");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setLocation("");
    setMeetingUrl("");
    setDescription("");
    setEventType("meeting");
    setStartsAt(defaultEventDatetimeInput());
    setShowForm(false);
  }

  function beginEdit(event: BookClubEvent) {
    setEditingId(event.id);
    setTitle(event.title);
    setLocation(event.location ?? "");
    setMeetingUrl(event.meeting_url ?? "");
    setDescription(event.description ?? "");
    setEventType(event.event_type);
    const d = new Date(event.starts_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setStartsAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    setShowForm(true);
  }

  function canEditEvent(event: BookClubEvent): boolean {
    return canManageEvents(viewerRole) || event.created_by === viewerId;
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
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Could not delete event."
              );
            },
          });
        },
      },
    ]);
  }

  function handleSave() {
    try {
      const startsAtIso = parseEventDatetime(startsAt);
      if (editingId) {
        updateMutation.mutate(
          {
            eventId: editingId,
            input: {
              title,
              location: location || null,
              meetingUrl: meetingUrl || null,
              description: description || null,
              startsAt: startsAtIso,
              eventType,
            },
          },
          {
            onSuccess: () => resetForm(),
            onError: (err) => {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Could not update event."
              );
            },
          }
        );
        return;
      }

      createMutation.mutate(
        {
          title,
          location: location || null,
          meetingUrl: meetingUrl || null,
          description: description || null,
          startsAt: startsAtIso,
          eventType,
        },
        {
          onSuccess: () => resetForm(),
          onError: (err) => {
            Alert.alert(
              "Error",
              err instanceof Error ? err.message : "Could not create event."
            );
          },
        }
      );
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Invalid date and time.");
    }
  }

  const upcoming = (listEvents.data ?? []).filter(
    (event) => new Date(event.starts_at).getTime() >= Date.now()
  );
  const listed = previewLimit ? upcoming.slice(0, previewLimit) : upcoming;
  const calendarSource = monthEvents.data ?? [];
  const dayEvents = selectedDayKey
    ? eventsForDayKey(calendarSource, selectedDayKey)
    : [];

  function renderEventCard(event: BookClubEvent) {
    return (
      <View
        key={event.id}
        className="rounded-xl border border-brand-border bg-background p-3"
      >
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Text className="font-semibold text-puce-red">{event.title}</Text>
            <Text className="mt-1 text-sm text-ink-muted">
              {formatEventDateTime(event.starts_at)}
            </Text>
            <Text className="mt-1 text-[11px] font-semibold uppercase text-ink-muted">
              {event.event_type.replace("_", " ")}
            </Text>
            {event.location ? (
              <Text className="mt-1 text-sm text-ink-muted">{event.location}</Text>
            ) : null}
            {event.meeting_url ? (
              <Pressable
                onPress={() => void Linking.openURL(event.meeting_url!)}
                accessibilityRole="link"
                accessibilityLabel="Join video call"
                className="mt-2 min-h-[44px] justify-center self-start"
              >
                <Text className="text-sm font-semibold text-primary">
                  Join video call ↗
                </Text>
              </Pressable>
            ) : null}
            {event.description ? (
              <Text className="mt-2 text-sm text-ink">{event.description}</Text>
            ) : null}
            <EventRsvpRow
              clubId={clubId}
              eventId={event.id}
              viewerId={viewerId}
              enabled={isMember}
            />
          </View>
          {canEditEvent(event) ? (
            <View className="gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit event"
                onPress={() => beginEdit(event)}
                className="min-h-[44px] justify-center px-1"
              >
                <Text className="text-xs font-semibold text-puce-red">Edit</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete event"
                onPress={() => handleDelete(event.id)}
                className="min-h-[44px] justify-center px-1"
              >
                <Text className="text-xs text-ink-muted">Delete</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-puce-red">Schedule</Text>
        {canManage ? (
          <Pressable
            onPress={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={showForm ? "Cancel event form" : "Add event"}
            className="min-h-[44px] justify-center"
          >
            <Text className="text-sm font-medium text-primary">
              {showForm ? "Cancel" : "Add event"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!previewLimit ? (
        <SegmentedTabs
          options={[
            { id: "list", label: "List" },
            { id: "calendar", label: "Calendar" },
          ]}
          value={view}
          onChange={setView}
          equalWidth
          compact
          accessibilityLabel="Schedule view"
          className="mb-3"
        />
      ) : null}

      {showForm ? (
        <View className="mb-4 gap-3 rounded-xl border border-brand-border bg-background p-3">
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Monthly read-along"
          />
          <View>
            <Text className="mb-1 text-sm font-medium text-ink">Event type</Text>
            <View className="flex-row flex-wrap gap-2">
              {EVENT_TYPES.map((option) => {
                const active = eventType === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setEventType(option.id)}
                    className={`min-h-[44px] justify-center rounded-full px-3 ${
                      active ? "bg-puce-red" : "bg-primary/15"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-puce-red"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View>
            <Text className="mb-1 text-sm font-medium text-ink">Date & time</Text>
            <TextInput
              value={startsAt}
              onChangeText={setStartsAt}
              placeholder="2026-07-25T19:00"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Event date and time"
              className="min-h-[44px] rounded-xl border border-brand-border bg-surface px-3 py-2.5 text-base text-ink"
            />
          </View>
          <Input
            label="Location (optional)"
            value={location}
            onChangeText={setLocation}
            placeholder="Bookstore, park, etc."
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
            <Text className="mb-1 text-sm font-medium text-ink">Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              accessibilityLabel="Event description"
              className="min-h-[80px] rounded-xl border border-brand-border bg-surface px-3 py-2.5 text-base text-ink"
              placeholder="What to bring, chapters to read…"
              style={{ textAlignVertical: "top" }}
            />
          </View>
          <Button
            title={
              createMutation.isPending || updateMutation.isPending
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Schedule event"
            }
            onPress={handleSave}
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              !title.trim()
            }
          />
        </View>
      ) : null}

      {view === "calendar" && !previewLimit ? (
        <View className="gap-3">
          {monthEvents.isLoading ? (
            <LoadingState message="Loading calendar…" />
          ) : (
            <ClubCalendar
              month={month}
              events={calendarSource}
              selectedDayKey={selectedDayKey}
              onChangeMonth={(next) => {
                setMonth(next);
                setSelectedDayKey(null);
              }}
              onSelectDay={setSelectedDayKey}
            />
          )}
          {selectedDayKey ? (
            dayEvents.length ? (
              <View className="gap-3">{dayEvents.map(renderEventCard)}</View>
            ) : (
              <Text className="text-sm text-ink-muted">No events on this day.</Text>
            )
          ) : (
            <Text className="text-sm text-ink-muted">
              Days with ✦ have events. Tap a day to see them.
            </Text>
          )}
        </View>
      ) : listEvents.isLoading ? (
        <LoadingState message="Loading events…" />
      ) : !listed.length ? (
        <Text className="text-sm text-ink-muted">
          {isMember
            ? "No upcoming events. Schedule a meetup or read-along for the club."
            : "This club has no upcoming events scheduled."}
        </Text>
      ) : (
        <View className="gap-3">{listed.map(renderEventCard)}</View>
      )}
    </View>
  );
}
