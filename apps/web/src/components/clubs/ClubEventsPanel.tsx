"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import {
  createClubEvent,
  datetimeLocalToIso,
  defaultEventDatetimeLocal,
  deleteClubEvent,
  formatEventDateTime,
  listClubEvents,
} from "@/lib/services/clubEvents";
import type { BookClubEvent } from "@/types";

type Props = {
  clubId: string;
  isMember: boolean;
  viewerId: string;
  clubOwnerId: string;
};

export function ClubEventsPanel({ clubId, isMember, viewerId, clubOwnerId }: Props) {
  const toast = useToast();
  const [events, setEvents] = useState<BookClubEvent[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [startsAt, setStartsAt] = useState(defaultEventDatetimeLocal);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const rows = await listClubEvents(clubId);
    setEvents(rows);
  }, [clubId]);

  useEffect(() => {
    void load().catch((err) => {
      console.error("[club-events] load failed:", err);
      setEvents([]);
    });
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await createClubEvent({
        clubId,
        title,
        location: location || null,
        meetingUrl: meetingUrl || null,
        description: description || null,
        startsAt: datetimeLocalToIso(startsAt),
      });
      toast.success("Event scheduled.");
      setTitle("");
      setLocation("");
      setMeetingUrl("");
      setDescription("");
      setStartsAt(defaultEventDatetimeLocal());
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteClubEvent(eventId);
      toast.success("Event deleted.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete event.");
    }
  }

  function canDelete(event: BookClubEvent): boolean {
    return event.created_by === viewerId || clubOwnerId === viewerId;
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-puce-red">Upcoming events</h2>
        {isMember ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm((open) => !open)}>
            {showForm ? "Cancel" : "Add event"}
          </Button>
        ) : null}
      </div>

      {isMember && showForm ? (
        <form onSubmit={(e) => void handleCreate(e)} className="mb-6 space-y-3 rounded-lg border border-border bg-background p-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Monthly read-along"
            required
          />
          <label className="block text-sm font-medium text-puce-red">
            Date & time
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </label>
          <Input
            label="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Zoom, bookstore, etc."
          />
          <Input
            label="Video call link (optional)"
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://zoom.us/j/... or Google Meet link"
          />
          <label className="block text-sm font-medium text-puce-red">
            Description (optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
              placeholder="What to bring, chapters to read…"
            />
          </label>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Saving…" : "Schedule event"}
          </Button>
        </form>
      ) : null}

      {events === null ? (
        <LoadingState message="Loading events…" />
      ) : events.length === 0 ? (
        <p className="text-sm text-text-muted">
          {isMember
            ? "No upcoming events. Schedule a meetup or read-along for the club."
            : "This club has no upcoming events scheduled."}
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-border bg-background px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-puce-red">{event.title}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {formatEventDateTime(event.starts_at)}
                  </p>
                  {event.location ? (
                    <p className="mt-1 text-sm text-text-muted">{event.location}</p>
                  ) : null}
                  {event.meeting_url ? (
                    <a
                      href={event.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Join video call ↗
                    </a>
                  ) : null}
                  {event.description ? (
                    <p className="mt-2 text-sm text-text">{event.description}</p>
                  ) : null}
                </div>
                {canDelete(event) ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete(event.id)}
                    className="shrink-0 text-xs text-text-muted hover:text-rust"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
