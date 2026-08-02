import { supabase } from "./supabase";
import {
  detectMeetingPlatform,
  isSafeHttpsUrl,
} from "../../../../packages/utils/clubPermissions";
import type {
  BookClubEvent,
  BookClubEventAttendee,
  BookClubEventType,
  BookClubEventWithClub,
  BookClubMeetingPlatform,
  BookClubRsvpStatus,
  MessageProfile,
} from "../types";

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");
  return { supabase, user };
}

export type CreateClubEventInput = {
  clubId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  meetingPlatform?: BookClubMeetingPlatform | null;
  eventType?: BookClubEventType;
  timezone?: string;
  readingAssignment?: string | null;
  startsAt: string;
  endsAt?: string | null;
  reminderConfig?: Record<string, unknown>;
};

export type UpdateClubEventInput = {
  title?: string;
  description?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  meetingPlatform?: BookClubMeetingPlatform | null;
  eventType?: BookClubEventType;
  timezone?: string;
  readingAssignment?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  reminderConfig?: Record<string, unknown>;
};

const EVENT_SELECT = [
  "id",
  "club_id",
  "created_by",
  "title",
  "description",
  "location",
  "meeting_url",
  "event_type",
  "timezone",
  "reading_assignment",
  "meeting_platform",
  "reminder_config",
  "starts_at",
  "ends_at",
  "created_at",
  "updated_at",
].join(", ");

const PROFILE_SELECT = "id, username, display_name, avatar_url";

function mapEvent(row: BookClubEvent): BookClubEvent {
  return {
    ...row,
    reminder_config:
      row.reminder_config && typeof row.reminder_config === "object"
        ? row.reminder_config
        : {},
  };
}

function validateMeetingUrl(url: string | null | undefined): string | null {
  if (url === undefined || url === null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!isSafeHttpsUrl(trimmed)) {
    throw new Error("Meeting URL must be a valid https link.");
  }
  return trimmed;
}

function resolveMeetingPlatform(
  meetingUrl: string | null,
  explicit?: BookClubMeetingPlatform | null
): BookClubMeetingPlatform | null {
  if (explicit !== undefined) return explicit;
  return detectMeetingPlatform(meetingUrl);
}

/** Upcoming (or all) events for a single club, soonest first. */
export async function listClubEvents(
  clubId: string,
  options: { limit?: number; includePast?: boolean } = {}
): Promise<BookClubEvent[]> {
  const limit = options.limit ?? 20;
  const now = new Date().toISOString();

  let query = supabase
    .from("book_club_events")
    .select(EVENT_SELECT)
    .eq("club_id", clubId)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (!options.includePast) {
    query = query.gte("starts_at", now);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as BookClubEvent[]).map((row) => mapEvent(row));
}

/** Events for a club whose start time falls in [startIso, endIso). */
export async function listClubEventsInRange(
  clubId: string,
  startIso: string,
  endIso: string
): Promise<BookClubEvent[]> {
  const { data, error } = await supabase
    .from("book_club_events")
    .select(EVENT_SELECT)
    .eq("club_id", clubId)
    .gte("starts_at", startIso)
    .lt("starts_at", endIso)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as unknown as BookClubEvent[]).map((row) => mapEvent(row));
}

/** Community calendar: upcoming events from public clubs and clubs the viewer belongs to. */
export async function listUpcomingEvents(limit = 50): Promise<BookClubEventWithClub[]> {
  await requireUser();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("book_club_events")
    .select(`${EVENT_SELECT}, club:book_clubs!inner(id, name, visibility)`)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as unknown as Array<
    BookClubEvent & {
      club: BookClubEventWithClub["club"] | BookClubEventWithClub["club"][];
    }
  >).map((row) => {
    const club = Array.isArray(row.club) ? row.club[0] : row.club;
    const { club: _club, ...event } = row;
    return {
      ...mapEvent(event),
      club,
    };
  });
}

export async function createClubEvent(input: CreateClubEventInput): Promise<BookClubEvent> {
  const { user } = await requireUser();
  const title = input.title.trim();
  if (!title) throw new Error("Event title is required.");

  const meetingUrl = validateMeetingUrl(input.meetingUrl);
  const meetingPlatform = resolveMeetingPlatform(meetingUrl, input.meetingPlatform);

  const { data, error } = await supabase
    .from("book_club_events")
    .insert({
      club_id: input.clubId,
      created_by: user.id,
      title,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      meeting_url: meetingUrl,
      meeting_platform: meetingPlatform,
      event_type: input.eventType ?? "meeting",
      timezone: input.timezone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      reading_assignment: input.readingAssignment?.trim() || null,
      reminder_config: input.reminderConfig ?? {},
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
    })
    .select(EVENT_SELECT)
    .single();

  if (error) throw error;
  return mapEvent(data as unknown as BookClubEvent);
}

export async function updateClubEvent(
  eventId: string,
  input: UpdateClubEventInput
): Promise<BookClubEvent> {
  await requireUser();

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new Error("Event title is required.");
    patch.title = title;
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.location !== undefined) patch.location = input.location?.trim() || null;
  if (input.meetingUrl !== undefined) {
    const meetingUrl = validateMeetingUrl(input.meetingUrl);
    patch.meeting_url = meetingUrl;
    if (input.meetingPlatform === undefined) {
      patch.meeting_platform = resolveMeetingPlatform(meetingUrl);
    }
  }
  if (input.meetingPlatform !== undefined) patch.meeting_platform = input.meetingPlatform;
  if (input.eventType !== undefined) patch.event_type = input.eventType;
  if (input.timezone !== undefined) patch.timezone = input.timezone.trim() || "UTC";
  if (input.readingAssignment !== undefined) {
    patch.reading_assignment = input.readingAssignment?.trim() || null;
  }
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;
  if (input.reminderConfig !== undefined) patch.reminder_config = input.reminderConfig;

  const { data, error } = await supabase
    .from("book_club_events")
    .update(patch)
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .single();

  if (error) throw error;
  return mapEvent(data as unknown as BookClubEvent);
}

export async function deleteClubEvent(eventId: string): Promise<void> {
  await requireUser();
  const { error } = await supabase.from("book_club_events").delete().eq("id", eventId);
  if (error) throw error;
}

export async function setEventRsvp(
  eventId: string,
  rsvpStatus: BookClubRsvpStatus
): Promise<BookClubEventAttendee> {
  const { user } = await requireUser();

  const { data: event, error: eventError } = await supabase
    .from("book_club_events")
    .select("id, club_id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event) throw new Error("Event not found.");

  const { data, error } = await supabase
    .from("book_club_event_attendees")
    .upsert(
      {
        event_id: eventId,
        club_id: event.club_id,
        user_id: user.id,
        rsvp_status: rsvpStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" }
    )
    .select(
      "id, event_id, club_id, user_id, rsvp_status, reminder_at, reminder_canceled, created_at, updated_at"
    )
    .single();

  if (error) throw error;
  return data as BookClubEventAttendee;
}

export type EventRsvpWithProfile = BookClubEventAttendee & {
  profile: MessageProfile;
};

export async function getEventRsvps(eventId: string): Promise<EventRsvpWithProfile[]> {
  const { data, error } = await supabase
    .from("book_club_event_attendees")
    .select(
      `id, event_id, club_id, user_id, rsvp_status, reminder_at, reminder_canceled, created_at, updated_at,
       profiles!book_club_event_attendees_user_profiles_fkey (${PROFILE_SELECT})`
    )
    .eq("event_id", eventId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  type Row = BookClubEventAttendee & {
    profiles: MessageProfile | MessageProfile[] | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const { profiles: _profiles, ...attendee } = row;
    return {
      ...attendee,
      profile: profile ?? {
        id: row.user_id,
        username: null,
        display_name: null,
        avatar_url: null,
      },
    };
  });
}

export async function setEventReminder(
  eventId: string,
  reminderAt: string | null
): Promise<BookClubEventAttendee> {
  const { user } = await requireUser();

  const { data: event, error: eventError } = await supabase
    .from("book_club_events")
    .select("id, club_id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event) throw new Error("Event not found.");

  const { data: existing } = await supabase
    .from("book_club_event_attendees")
    .select("id, rsvp_status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("book_club_event_attendees")
    .upsert(
      {
        event_id: eventId,
        club_id: event.club_id,
        user_id: user.id,
        rsvp_status: existing?.rsvp_status ?? "going",
        reminder_at: reminderAt,
        reminder_canceled: reminderAt === null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" }
    )
    .select(
      "id, event_id, club_id, user_id, rsvp_status, reminder_at, reminder_canceled, created_at, updated_at"
    )
    .single();

  if (error) throw error;
  return data as BookClubEventAttendee;
}

export function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Parse ISO or `YYYY-MM-DDTHH:mm` into ISO for Supabase. */
export function parseEventDatetime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date and time.");
  }
  return date.toISOString();
}

export function defaultEventDatetimeInput(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export { detectMeetingPlatform };
