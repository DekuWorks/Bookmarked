import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClubEvent,
  deleteClubEvent,
  listClubEvents,
  listUpcomingEvents,
  type CreateClubEventInput,
} from "../services/clubEvents";

export function useClubEvents(clubId: string) {
  return useQuery({
    queryKey: ["club-events", clubId],
    queryFn: () => listClubEvents(clubId),
    enabled: Boolean(clubId),
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ["upcoming-events"],
    queryFn: () => listUpcomingEvents(),
  });
}

export function useCreateClubEvent(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateClubEventInput, "clubId">) =>
      createClubEvent({ ...input, clubId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-events", clubId] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });
}

export function useDeleteClubEvent(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => deleteClubEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-events", clubId] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });
}
