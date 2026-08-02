import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClubEvent,
  deleteClubEvent,
  getEventRsvps,
  listClubEvents,
  listClubEventsInRange,
  listUpcomingEvents,
  setEventReminder,
  setEventRsvp,
  updateClubEvent,
  type CreateClubEventInput,
  type UpdateClubEventInput,
} from "../services/clubEvents";
import type { BookClubRsvpStatus } from "../types";

export function useClubEvents(
  clubId: string,
  options: { limit?: number; includePast?: boolean } = {}
) {
  return useQuery({
    queryKey: ["club-events", clubId, options.includePast ?? false, options.limit ?? 20],
    queryFn: () => listClubEvents(clubId, options),
    enabled: Boolean(clubId),
  });
}

export function useClubEventsInRange(clubId: string, startIso: string, endIso: string) {
  return useQuery({
    queryKey: ["club-events-range", clubId, startIso, endIso],
    queryFn: () => listClubEventsInRange(clubId, startIso, endIso),
    enabled: Boolean(clubId) && Boolean(startIso) && Boolean(endIso),
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ["upcoming-events"],
    queryFn: () => listUpcomingEvents(),
  });
}

export function useEventRsvps(eventId: string) {
  return useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: () => getEventRsvps(eventId),
    enabled: Boolean(eventId),
  });
}

function useInvalidateEvents(clubId: string, eventId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["club-events", clubId] });
    queryClient.invalidateQueries({ queryKey: ["club-events-range", clubId] });
    queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ["event-rsvps", eventId] });
    }
  };
}

export function useCreateClubEvent(clubId: string) {
  const invalidate = useInvalidateEvents(clubId);
  return useMutation({
    mutationFn: (input: Omit<CreateClubEventInput, "clubId">) =>
      createClubEvent({ ...input, clubId }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateClubEvent(clubId: string) {
  const invalidate = useInvalidateEvents(clubId);
  return useMutation({
    mutationFn: ({ eventId, input }: { eventId: string; input: UpdateClubEventInput }) =>
      updateClubEvent(eventId, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteClubEvent(clubId: string) {
  const invalidate = useInvalidateEvents(clubId);
  return useMutation({
    mutationFn: (eventId: string) => deleteClubEvent(eventId),
    onSuccess: () => invalidate(),
  });
}

export function useSetEventRsvp(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      rsvpStatus,
    }: {
      eventId: string;
      rsvpStatus: BookClubRsvpStatus;
    }) => setEventRsvp(eventId, rsvpStatus),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["club-events", clubId] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      queryClient.invalidateQueries({ queryKey: ["event-rsvps", variables.eventId] });
    },
  });
}

export function useSetEventReminder(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      reminderAt,
    }: {
      eventId: string;
      reminderAt: string | null;
    }) => setEventReminder(eventId, reminderAt),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["club-events", clubId] });
      queryClient.invalidateQueries({ queryKey: ["event-rsvps", variables.eventId] });
    },
  });
}
