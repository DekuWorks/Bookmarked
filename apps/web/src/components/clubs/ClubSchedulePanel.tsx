"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { ClubCalendar } from "@/components/clubs/ClubCalendar";
import {
  createClubEvent,
  datetimeLocalToIso,
  defaultEventDatetimeLocal,
  deleteClubEvent,
  formatEventDateTime,
  getEventRsvps,
  listClubEvents,
  setEventRsvp,
  updateClubEvent,
} from "@/lib/services/clubEvents";
import { absoluteAppUrl, copyTextToClipboard } from "@/lib/utils/copyLink";
import { clubDetailPath } from "@/lib/routes/clubs";
import {
  MEETING_PLATFORM_LABELS,
  canManageEvents,
  isSafeHttpsUrl,
} from "@bookmarked/utils/clubPermissions";
import type {
  BookClubEvent,
  BookClubEventType,
  BookClubMeetingPlatform,
  BookClubMemberRole,
  BookClubRsvpStatus,
} from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  clubId: string;
  isMember: boolean;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
};

type ViewMode = "list" | "calendar";

const EVENT_TYPES: Array<{ value: BookClubEventType; label: string }> = [
  { value: "meeting", label: "Meeting" },
  { value: "discussion", label: "Discussion" },
  { value: "reading_deadline", label: "Reading deadline" },
  { value: "readathon", label: "Readathon" },
  { value: "announcement", label: "Announcement" },
  { value: "other", label: "Other" },
];

const PLATFORMS: Array<{ value: BookClubMeetingPlatform; label: string }> = [
  { value: "zoom", label: MEETING_PLATFORM_LABELS.zoom },
  { value: "google_meet", label: MEETING_PLATFORM_LABELS.google_meet },
  { value: "microsoft_teams", label: MEETING_PLATFORM_LABELS.microsoft_teams },
  { value: "other", label: MEETING_PLATFORM_LABELS.other },
];

const RSVP_OPTIONS: Array<{ value: BookClubRsvpStatus; label: string }> = [
  { value: "going", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "not_going", label: "Not Going" },
];

function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return defaultEventDatetimeLocal();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type EventFormState = {
  title: string;
  eventType: BookClubEventType;
  startsAt: string;
  endsAt: string;
  timezone: string;
  description: string;
  readingAssignment: string;
  meetingPlatform: BookClubMeetingPlatform | "";
  meetingUrl: string;
};

function emptyForm(): EventFormState {
  return {
    title: "",
    eventType: "meeting",
    startsAt: defaultEventDatetimeLocal(),
    endsAt: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    description: "",
    readingAssignment: "",
    meetingPlatform: "",
    meetingUrl: "",
  };
}

function formFromEvent(event: BookClubEvent): EventFormState {
  return {
    title: event.title,
    eventType: event.event_type,
    startsAt: isoToDatetimeLocal(event.starts_at),
    endsAt: event.ends_at ? isoToDatetimeLocal(event.ends_at) : "",
    timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    description: event.description ?? "",
    readingAssignment: event.reading_assignment ?? "",
    meetingPlatform: event.meeting_platform ?? "",
    meetingUrl: event.meeting_url ?? "",
  };
}

export function ClubSchedulePanel({ clubId, isMember, viewerId, viewerRole }: Props) {
  const toast = useToast();
  const canManage = canManageEvents(viewerRole);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [events, setEvents] = useState<BookClubEvent[] | null>(null);
  const [pastEvents, setPastEvents] = useState<BookClubEvent[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [dayEvents, setDayEvents] = useState<BookClubEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [pending, setPending] = useState(false);
  const [rsvpByEvent, setRsvpByEvent] = useState<Record<string, BookClubRsvpStatus | null>>({});
  const [rsvpPendingId, setRsvpPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [upcoming, all] = await Promise.all([
      listClubEvents(clubId, { limit: 50 }),
      listClubEvents(clubId, { limit: 100, includePast: true }),
    ]);
    setEvents(upcoming);
    const now = Date.now();
    setPastEvents(
      all
        .filter((event) => new Date(event.starts_at).getTime() < now)
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    );

    const rsvpEntries = await Promise.all(
      upcoming.slice(0, 20).map(async (event) => {
        const rows = await getEventRsvps(event.id).catch(() => []);
        const mine = rows.find((row) => row.user_id === viewerId);
        return [event.id, mine?.rsvp_status ?? null] as const;
      })
    );
    setRsvpByEvent(Object.fromEntries(rsvpEntries));
  }, [clubId, viewerId]);

  useEffect(() => {
    void load().catch((err) => {
      console.error("[club-schedule] load failed:", err);
      setEvents([]);
      setPastEvents([]);
    });
  }, [load]);

  const calendarEvents = useMemo(() => {
    const all = [...(events ?? []), ...pastEvents];
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    return all.filter((event) => {
      const t = new Date(event.starts_at).getTime();
      return t >= start.getTime() && t < end.getTime();
    });
  }, [events, pastEvents, month]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(event: BookClubEvent) {
    setEditingId(event.id);
    setForm(formFromEvent(event));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.meetingUrl.trim() && !isSafeHttpsUrl(form.meetingUrl.trim())) {
      toast.error("Meeting URL must be a valid https link.");
      return;
    }

    setPending(true);
    try {
      const payload = {
        title: form.title,
        eventType: form.eventType,
        startsAt: datetimeLocalToIso(form.startsAt),
        endsAt: form.endsAt ? datetimeLocalToIso(form.endsAt) : null,
        timezone: form.timezone,
        description: form.description || null,
        readingAssignment: form.readingAssignment || null,
        meetingPlatform: (form.meetingPlatform || null) as BookClubMeetingPlatform | null,
        meetingUrl: form.meetingUrl || null,
      };

      if (editingId) {
        await updateClubEvent(editingId, payload);
        toast.success("Event updated.");
      } else {
        await createClubEvent({ clubId, ...payload });
        toast.success("Event scheduled.");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save event.");
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

  async function handleRsvp(eventId: string, status: BookClubRsvpStatus) {
    setRsvpPendingId(eventId);
    try {
      await setEventRsvp(eventId, status);
      setRsvpByEvent((current) => ({ ...current, [eventId]: status }));
      toast.success(`RSVP: ${RSVP_OPTIONS.find((o) => o.value === status)?.label ?? status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update RSVP.");
    } finally {
      setRsvpPendingId(null);
    }
  }

  async function copyEventLink(eventId: string) {
    const url = absoluteAppUrl(`${clubDetailPath(clubId)}&tab=schedule&event=${eventId}`);
    const ok = await copyTextToClipboard(url);
    if (!ok) {
      toast.error("Could not copy link.");
      return;
    }
    toast.success("Event link copied.");
  }

  function renderEventCard(event: BookClubEvent, options?: { past?: boolean }) {
    const canEdit = canManage || event.created_by === viewerId;
    const platformLabel = event.meeting_platform
      ? MEETING_PLATFORM_LABELS[event.meeting_platform] ?? event.meeting_platform
      : null;

    return (
      <li key={event.id} className="rounded-lg border border-border bg-background px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-puce-red">{event.title}</p>
              <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                {EVENT_TYPES.find((t) => t.value === event.event_type)?.label ?? event.event_type}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {formatEventDateTime(event.starts_at)}
              {event.ends_at ? ` – ${formatEventDateTime(event.ends_at)}` : ""}
              {event.timezone ? ` · ${event.timezone}` : ""}
            </p>
            {event.reading_assignment ? (
              <p className="mt-1 text-sm text-text">
                <span className="font-medium text-text-muted">Reading: </span>
                {event.reading_assignment}
              </p>
            ) : null}
            {event.description ? (
              <p className="mt-2 text-sm text-text">{event.description}</p>
            ) : null}
            {platformLabel ? (
              <p className="mt-1 text-xs text-text-muted">{platformLabel}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {event.meeting_url ? (
                <a
                  href={event.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[36px] items-center rounded-lg bg-primary px-3 text-sm font-medium text-on-primary hover:opacity-90"
                >
                  Join meeting
                </a>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyEventLink(event.id)}
              >
                Copy link
              </Button>
            </div>

            {isMember && !options?.past ? (
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`RSVP for ${event.title}`}>
                {RSVP_OPTIONS.map((option) => {
                  const active = rsvpByEvent[event.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={rsvpPendingId === event.id}
                      onClick={() => void handleRsvp(event.id, option.value)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium",
                        active
                          ? "border-primary bg-primary/15 text-puce-red"
                          : "border-border text-text-muted hover:border-primary/40"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {canEdit ? (
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => openEdit(event)}
                className="text-xs text-text-muted hover:text-primary"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(event.id)}
                className="text-xs text-text-muted hover:text-rust"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </li>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-puce-red">Schedule</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-lg border border-border bg-surface p-0.5"
            role="group"
            aria-label="Schedule view"
          >
            {(
              [
                ["list", "List"],
                ["calendar", "Calendar"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  viewMode === mode
                    ? "bg-puce-red text-white"
                    : "text-text-muted hover:text-primary"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {canManage || isMember ? (
            <Button type="button" variant="ghost" size="sm" onClick={openCreate}>
              {showForm && !editingId ? "Cancel" : "Add event"}
            </Button>
          ) : null}
        </div>
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-puce-red">
            {editingId ? "Edit event" : "Create event"}
          </h3>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <label className="mb-4 block text-sm font-medium text-text">
            Type
            <select
              value={form.eventType}
              onChange={(e) =>
                setForm((f) => ({ ...f, eventType: e.target.value as BookClubEventType }))
              }
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-text">
              Start
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                required
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
              />
            </label>
            <label className="block text-sm font-medium text-text">
              End (optional)
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
              />
            </label>
          </div>
          <Input
            label="Timezone"
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            placeholder="America/New_York"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
          />
          <Input
            label="Reading assignment"
            value={form.readingAssignment}
            onChange={(e) => setForm((f) => ({ ...f, readingAssignment: e.target.value }))}
            placeholder="Chapters 1–5"
          />
          <label className="mb-4 block text-sm font-medium text-text">
            Meeting platform
            <select
              value={form.meetingPlatform}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  meetingPlatform: e.target.value as BookClubMeetingPlatform | "",
                }))
              }
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
            >
              <option value="">None</option>
              {PLATFORMS.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Meeting URL (https)"
            type="url"
            value={form.meetingUrl}
            onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
            placeholder="https://zoom.us/j/…"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={pending}>
              {editingId ? "Save changes" : "Schedule event"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {viewMode === "calendar" ? (
        <div className="space-y-4">
          <ClubCalendar
            month={month}
            events={calendarEvents}
            selectedDayKey={selectedDayKey}
            onChangeMonth={setMonth}
            onSelectDay={(key, selected) => {
              setSelectedDayKey(key);
              setDayEvents(selected);
            }}
          />
          {selectedDayKey ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-puce-red">
                Events on {selectedDayKey}
              </h3>
              {dayEvents.length === 0 ? (
                <p className="text-sm text-text-muted">No events on this day.</p>
              ) : (
                <ul className="space-y-3">{dayEvents.map((event) => renderEventCard(event))}</ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Tap a day to see events. Sparkles mark event days.</p>
          )}
        </div>
      ) : null}

      {viewMode === "list" ? (
        <>
          {events === null ? (
            <LoadingState message="Loading events…" />
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
              <p className="font-medium text-puce-red">No upcoming events</p>
              <p className="mt-2 text-sm text-text-muted">
                {isMember
                  ? "Schedule a meetup, deadline, or read-along for the club."
                  : "This club has no upcoming events scheduled."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">{events.map((event) => renderEventCard(event))}</ul>
          )}
        </>
      ) : null}

      {pastEvents.length ? (
        <div className="pt-2">
          <h3 className="mb-3 text-sm font-semibold text-text-muted">Past events</h3>
          <ul className="space-y-3 opacity-80">
            {pastEvents.slice(0, 10).map((event) => renderEventCard(event, { past: true }))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
