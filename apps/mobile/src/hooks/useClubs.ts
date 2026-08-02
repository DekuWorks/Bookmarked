import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvitation,
  addClubBook,
  approveJoinRequest,
  banMember,
  cancelInvitation,
  createAnnouncement,
  createClub,
  createDiscussion,
  createReply,
  declineInvitation,
  declineJoinRequest,
  deleteAnnouncement,
  deleteClub,
  deleteDiscussion,
  deleteReply,
  discoverClubs,
  ensureClubGroupConversation,
  getClub,
  getClubConversationId,
  getClubStats,
  getMyClubs,
  joinClub,
  leaveClub,
  listAnnouncements,
  listClubBooks,
  listDiscussions,
  listInvitations,
  listJoinRequests,
  listReplies,
  removeClubBook,
  removeMember,
  requestToJoin,
  sendInvitations,
  setClubBookCategory,
  setCurrentBook,
  setCurrentRead,
  setDiscussionLocked,
  setDiscussionPinned,
  shareClubToFeed,
  toggleReaction,
  transferOwnership,
  updateClub,
  updateDiscussion,
  updateMemberRole,
  type CreateAnnouncementInput,
  type CreateClubInput,
  type CreateDiscussionInput,
  type SetCurrentReadInput,
  type ToggleReactionTarget,
  type UpdateClubInput,
  type UpdateDiscussionInput,
} from "../services/bookClubs";
import type { BookClubBookCategory, BookClubMemberRole } from "../types";
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

export function useClubDiscussionReplies(discussionId: string) {
  return useQuery({
    queryKey: ["club-discussion-replies", discussionId],
    queryFn: () => listReplies(discussionId),
    enabled: Boolean(discussionId),
  });
}

export function useClubInvitations() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["club-invitations", userId],
    queryFn: () => listInvitations(userId as string),
    enabled: Boolean(userId),
  });
}

export function useClubJoinRequests(clubId: string) {
  return useQuery({
    queryKey: ["club-join-requests", clubId],
    queryFn: () => listJoinRequests(clubId),
    enabled: Boolean(clubId),
  });
}

export function useClubBooks(clubId: string) {
  return useQuery({
    queryKey: ["club-books", clubId],
    queryFn: () => listClubBooks(clubId),
    enabled: Boolean(clubId),
  });
}

export function useClubAnnouncements(clubId: string) {
  return useQuery({
    queryKey: ["club-announcements", clubId],
    queryFn: () => listAnnouncements(clubId),
    enabled: Boolean(clubId),
  });
}

export function useClubStats(clubId: string) {
  return useQuery({
    queryKey: ["club-stats", clubId],
    queryFn: () => getClubStats(clubId),
    enabled: Boolean(clubId),
  });
}

export function useClubConversationId(clubId: string) {
  return useQuery({
    queryKey: ["club-conversation", clubId],
    queryFn: () => getClubConversationId(clubId),
    enabled: Boolean(clubId),
  });
}

/** Invalidate every club-related query after a mutation. */
function useInvalidateClubs(clubId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["clubs"] });
    queryClient.invalidateQueries({ queryKey: ["club-invitations"] });
    if (clubId) {
      queryClient.invalidateQueries({ queryKey: ["club", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-discussions", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-join-requests", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-books", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-announcements", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-stats", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-conversation", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-events", clubId] });
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

export function useRequestToJoin(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (message?: string | null) => requestToJoin(clubId, message),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useCreateDiscussion(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (input: string | CreateDiscussionInput) => createDiscussion(clubId, input),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useUpdateDiscussion(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: ({
      discussionId,
      input,
    }: {
      discussionId: string;
      input: UpdateDiscussionInput;
    }) => updateDiscussion(discussionId, input),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useCreateReply(clubId: string, discussionId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (input: { body: string; containsSpoilers?: boolean }) =>
      createReply(discussionId, input.body, { containsSpoilers: input.containsSpoilers }),
    onSuccess: (result) => {
      if (!result.error) {
        invalidate();
        queryClient.invalidateQueries({ queryKey: ["club-discussion-replies", discussionId] });
      }
    },
  });
}

export function useDeleteReply(clubId: string, discussionId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (replyId: string) => deleteReply(replyId),
    onSuccess: (result) => {
      if (!result.error) {
        invalidate();
        queryClient.invalidateQueries({ queryKey: ["club-discussion-replies", discussionId] });
      }
    },
  });
}

export function useSetDiscussionPinned(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: ({ discussionId, isPinned }: { discussionId: string; isPinned: boolean }) =>
      setDiscussionPinned(discussionId, isPinned),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useSetDiscussionLocked(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: ({ discussionId, isLocked }: { discussionId: string; isLocked: boolean }) =>
      setDiscussionLocked(discussionId, isLocked),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useToggleDiscussionReaction(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: ({ target, emoji }: { target: ToggleReactionTarget; emoji: string }) =>
      toggleReaction(target, emoji),
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

export function useSetCurrentRead(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (input: SetCurrentReadInput) => setCurrentRead(clubId, input),
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

export function useBanMember(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (memberUserId: string) => banMember(clubId, memberUserId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useUpdateMemberRole(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: ({
      memberUserId,
      role,
    }: {
      memberUserId: string;
      role: Exclude<BookClubMemberRole, "owner">;
    }) => updateMemberRole(clubId, memberUserId, role),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useTransferOwnership(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (newOwnerId: string) => transferOwnership(clubId, newOwnerId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useSendInvitations(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: ({
      inviteeIds,
      message,
    }: {
      inviteeIds: string[];
      message?: string | null;
    }) => sendInvitations(clubId, inviteeIds, message),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useCancelInvitation(clubId?: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(invitationId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useAcceptInvitation() {
  const invalidate = useInvalidateClubs();
  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useDeclineInvitation() {
  const invalidate = useInvalidateClubs();
  return useMutation({
    mutationFn: (invitationId: string) => declineInvitation(invitationId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useApproveJoinRequest(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (requestId: string) => approveJoinRequest(requestId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useDeclineJoinRequest(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (requestId: string) => declineJoinRequest(requestId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useEnsureClubGroupConversation(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: () => ensureClubGroupConversation(clubId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useAddClubBook(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: ({
      bookId,
      category,
    }: {
      bookId: string;
      category?: BookClubBookCategory;
    }) => addClubBook(clubId, bookId, category),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useRemoveClubBook(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (shelfBookId: string) => removeClubBook(shelfBookId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useSetClubBookCategory(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: ({
      shelfBookId,
      category,
    }: {
      shelfBookId: string;
      category: BookClubBookCategory;
    }) => setClubBookCategory(shelfBookId, category),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useCreateAnnouncement(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) => createAnnouncement(clubId, input),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useDeleteAnnouncement(clubId: string) {
  const invalidate = useInvalidateClubs(clubId);
  return useMutation({
    mutationFn: (announcementId: string) => deleteAnnouncement(announcementId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}

export function useShareClubToFeed(clubId: string) {
  return useMutation({
    mutationFn: () => shareClubToFeed(clubId),
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
    mutationFn: (discussionId: string) => deleteDiscussion(discussionId),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });
}
