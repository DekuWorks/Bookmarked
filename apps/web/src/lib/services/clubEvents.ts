import { createClient } from "@/lib/supabase/client";
import type { BookClubEvent, BookClubEventWithClub } from "@/types";

async function requireUser() {
  const supabase = createClient();
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
  startsAt: string;
  endsAt?: string | null;
};

export type UpdateClubEventInput = {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string | null;
};

const EVENT_SELECT = "id, club_id, created_by, title, description, location, starts_at, ends_at, created_at, updated_at";

function mapEvent(row: BookClubEvent): BookClubEvent {
  return row;
}

/** Upcoming events for a single club, soonest first. */
export async function listClubEvents(clubId: string, limit = 20): Promise<BookClubEvent[]> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("book_club_events")
    .select(EVENT_SELECT)
    .eq("club_id", clubId)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapEvent(row as BookClubEvent));
}

/** Community calendar: upcoming events from public clubs and clubs the viewer belongs to. */
export async function listUpcomingEvents(limit = 50): Promise<BookClubEventWithClub[]> {
  await requireUser();
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("book_club_events")
    .select(`${EVENT_SELECT}, club:book_clubs!inner(id, name, visibility)`)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const raw = row as BookClubEvent & {
      club: BookClubEventWithClub["club"] | BookClubEventWithClub["club"][];
    };
    const club = Array.isArray(raw.club) ? raw.club[0] : raw.club;
    const { club: _club, ...event } = raw;
    return {
      ...(event as BookClubEvent),
      club,
    };
  });
}

export async function createClubEvent(input: CreateClubEventInput): Promise<BookClubEvent> {
  const { supabase, user } = await requireUser();
  const title = input.title.trim();
  if (!title) throw new Error("Event title is required.");

  const { data, error } = await supabase
    .from("book_club_events")
    .insert({
      club_id: input.clubId,
      created_by: user.id,
      title,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
    })
    .select(EVENT_SELECT)
    .single();

  if (error) throw error;
  return mapEvent(data as BookClubEvent);
}

export async function updateClubEvent(
  eventId: string,
  input: UpdateClubEventInput
): Promise<BookClubEvent> {
  await requireUser();
  const supabase = createClient();

  const patch: Record<string, string | null> = {};
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new Error("Event title is required.");
    patch.title = title;
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.location !== undefined) patch.location = input.location?.trim() || null;
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;

  const { data, error } = await supabase
    .from("book_club_events")
    .update(patch)
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .single();

  if (error) throw error;
  return mapEvent(data as BookClubEvent);
}

export async function deleteClubEvent(eventId: string): Promise<void> {
  await requireUser();
  const supabase = createClient();
  const { error } = await supabase.from("book_club_events").delete().eq("id", eventId);
  if (error) throw error;
}

/** Format an event timestamp for display in lists. */
export function formatEventDateTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Convert a `datetime-local` value to ISO for Supabase. */
export function datetimeLocalToIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date and time.");
  }
  return date.toISOString();
}

/** Default `datetime-local` value ~one week from now at 7pm local. */
export function defaultEventDatetimeLocal(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
