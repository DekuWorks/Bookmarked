import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FollowListScreen } from "../../../../src/components/FollowListScreen";
import { useFollowList, useSharedFollowing } from "../../../../src/hooks/useFollows";
import { getProfileByUsername } from "../../../../src/services/profile";
import { useAuthStore } from "../../../../src/store/authStore";

export default function FollowersScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const handle = decodeURIComponent(String(username ?? "")).replace(/^@/, "");
  const viewerId = useAuthStore((s) => s.user?.id);

  const profileQuery = useQuery({
    queryKey: ["reader-profile", handle],
    queryFn: () => getProfileByUsername(handle),
    enabled: Boolean(handle),
  });
  const profile = profileQuery.data;
  const isOwnProfile = Boolean(profile?.id && profile.id === viewerId);

  const listQuery = useFollowList(profile?.id, "followers");
  const sharedQuery = useSharedFollowing(profile?.id, !isOwnProfile);

  const users = listQuery.data ?? [];
  const mutuals = users.filter((user) => user.isMutual);
  const others = users.filter((user) => !user.isMutual);
  const shared =
    (sharedQuery.data ?? []).filter(
      (user) => !mutuals.some((mutual) => mutual.id === user.id)
    );

  const name =
    profile?.display_name?.trim() || profile?.username?.trim() || handle || "Reader";

  const loading =
    profileQuery.isLoading || listQuery.isLoading || (!isOwnProfile && sharedQuery.isLoading);
  const error =
    profileQuery.error?.message ||
    listQuery.error?.message ||
    sharedQuery.error?.message ||
    null;

  return (
    <FollowListScreen
      title={`${name} · Followers`}
      loading={loading}
      error={error}
      emptyTitle="No followers yet."
      sections={[
        { title: "Mutuals", users: mutuals },
        ...(!isOwnProfile
          ? [{ title: "You both follow", users: shared }]
          : []),
        {
          title: mutuals.length > 0 || shared.length > 0 ? "All followers" : "",
          users: others,
          muted: true,
        },
      ]}
    />
  );
}
