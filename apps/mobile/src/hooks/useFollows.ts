import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  followUser,
  getFollowCounts,
  getFollowList,
  getMutuals,
  getSharedFollowing,
  isFollowing,
  unfollowUser,
  type FollowListKind,
} from "../services/follows";
import { useAuthStore } from "../store/authStore";

export function useFollowCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ["follow-counts", userId],
    queryFn: () => getFollowCounts(userId as string),
    enabled: Boolean(userId),
  });
}

export function useIsFollowing(
  targetUserId: string | undefined,
  enabled = true,
  initialFollowing?: boolean
) {
  const viewerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["is-following", viewerId, targetUserId],
    queryFn: () => isFollowing(viewerId as string, targetUserId as string),
    enabled: Boolean(viewerId) && Boolean(targetUserId) && enabled,
    ...(initialFollowing !== undefined ? { initialData: initialFollowing } : {}),
  });
}

export function useFollowList(
  profileUserId: string | undefined,
  kind: FollowListKind,
  enabled = true
) {
  const viewerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["follow-list", profileUserId, kind, viewerId],
    queryFn: () => getFollowList(profileUserId as string, viewerId as string, kind),
    enabled: Boolean(profileUserId) && Boolean(viewerId) && enabled,
  });
}

export function useSharedFollowing(
  profileUserId: string | undefined,
  enabled = true
) {
  const viewerId = useAuthStore((s) => s.user?.id);
  const isOther = Boolean(profileUserId) && profileUserId !== viewerId;
  return useQuery({
    queryKey: ["shared-following", profileUserId, viewerId],
    queryFn: () => getSharedFollowing(profileUserId as string, viewerId as string),
    enabled: Boolean(viewerId) && isOther && enabled,
  });
}

export function useMutuals(profileUserId: string | undefined, enabled = true) {
  const viewerId = useAuthStore((s) => s.user?.id);
  const isOther = Boolean(profileUserId) && profileUserId !== viewerId;
  return useQuery({
    queryKey: ["mutuals", profileUserId, viewerId],
    queryFn: () => getMutuals(profileUserId as string, viewerId as string),
    enabled: Boolean(viewerId) && isOther && enabled,
  });
}

function useInvalidateFollows() {
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id);

  return (targetUserId: string) => {
    queryClient.invalidateQueries({ queryKey: ["follow-counts", targetUserId] });
    if (viewerId) {
      queryClient.invalidateQueries({ queryKey: ["follow-counts", viewerId] });
      queryClient.invalidateQueries({ queryKey: ["is-following", viewerId, targetUserId] });
    }
    queryClient.invalidateQueries({ queryKey: ["follow-list"] });
    queryClient.invalidateQueries({ queryKey: ["shared-following"] });
    queryClient.invalidateQueries({ queryKey: ["mutuals"] });
    queryClient.invalidateQueries({ queryKey: ["home-feed"] });
  };
}

export function useToggleFollow(
  targetUserId: string | undefined,
  initialFollowing?: boolean
) {
  const invalidate = useInvalidateFollows();
  const followingQuery = useIsFollowing(targetUserId, true, initialFollowing);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!targetUserId) return { error: "Missing user." };
      return followingQuery.data
        ? unfollowUser(targetUserId)
        : followUser(targetUserId);
    },
    onSuccess: (result) => {
      if (!result.error && targetUserId) invalidate(targetUserId);
    },
  });

  return {
    isFollowing: Boolean(followingQuery.data),
    isLoading: followingQuery.isLoading || mutation.isPending,
    toggle: () => mutation.mutateAsync(),
  };
}
