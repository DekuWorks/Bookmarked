import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClub,
  createDiscussion,
  deleteClub,
  deleteDiscussion,
  discoverClubs,
  getClub,
  getMyClubs,
  joinClub,
  leaveClub,
  listDiscussions,
  removeMember,
  setCurrentBook,
  updateClub,
  type CreateClubInput,
  type UpdateClubInput,
} from "../services/bookClubs";
import { useAuthStore } from "../store/authStore";

export function useDiscoverClubs() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["clubs", "discover", userId],
    queryFn: () => discoverClubs(userId as string),
    enabled: Boolean(userId),
  });
}

export function useMyClubs() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["clubs", "mine", userId],
    queryFn: () => getMyClubs(userId as string),
    enabled: Boolean(userId),
  });
}

export function useClub(clubId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["club", clubId, userId],
    queryFn: () => getClub(clubId, userId as string),
    enabled: Boolean(userId) && Boolean(clubId),
  });
}

export function useClubDiscussions(clubId: string) {
  return useQuery({
    queryKey: ["club-discussions", clubId],
    queryFn: () => listDiscussions(clubId),
    enabled: Boolean(clubId),
  });
}

/** Invalidate every club-related query after a mutation. */
function useInvalidateClubs(clubId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["clubs"] });
    if (clubId) {
      queryClient.invalidateQueries({ queryKey: ["club", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-discussions", clubId] });
    }
  };
}

export function useJoinClub(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: () => joinClub(clubId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useLeaveClub(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: () => leaveClub(clubId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useCreateDiscussion(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (body: string) => createDiscussion(clubId, body),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useCreateClub() {
  const invalidate = useInvalidateClubs();
  return useMutation({
    mutationFn: (input: CreateClubInput) => createClub(input),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useUpdateClub(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (input: UpdateClubInput) => updateClub(clubId, input),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useSetCurrentBook(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (bookId: string | null) => setCurrentBook(clubId, bookId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useRemoveMember(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (memberUserId: string) => removeMember(clubId, memberUserId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useDeleteClub(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: () => deleteClub(clubId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useDeleteDiscussion(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (postId: string) => deleteDiscussion(postId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}
