import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FollowListScreen } from "../../../../src/components/FollowListScreen";
import { useMutuals, useSharedFollowing } from "../../../../src/hooks/useFollows";
import { getProfileByUsername } from "../../../../src/services/profile";
import { useAuthStore } from "../../../../src/store/authStore";

export default function MutualsScreen() {
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

  const mutualsQuery = useMutuals(profile?.id, !isOwnProfile);
  const sharedQuery = useSharedFollowing(profile?.id, !isOwnProfile);

  const mutuals = mutualsQuery.data ?? [];
  const shared =
    (sharedQuery.data ?? []).filter(
      (user) => !mutuals.some((mutual) => mutual.id === user.id)
    );

  const name =
    profile?.display_name?.trim() || profile?.username?.trim() || handle || "Reader";

  const loading =
    profileQuery.isLoading ||
    (!isOwnProfile && (mutualsQuery.isLoading || sharedQuery.isLoading));
  const error =
    profileQuery.error?.message ||
    mutualsQuery.error?.message ||
    sharedQuery.error?.message ||
    null;

  if (isOwnProfile) {
    return (
      <FollowListScreen
        title={`${name} · Mutuals`}
        loading={profileQuery.isLoading}
        error={error}
        emptyTitle="Mutuals are shown on other readers' profiles."
        emptyDescription="Open someone else's profile to see people you both know."
        sections={[]}
      />
    );
  }

  return (
    <FollowListScreen
      title={`${name} · Mutuals`}
      loading={loading}
      error={error}
      emptyTitle="No mutuals yet."
      emptyDescription="Mutuals are people you follow who also follow you, among their connections. You both follow lists people you and they both follow."
      sections={[
        { title: "Mutuals", users: mutuals },
        { title: "You both follow", users: shared },
      ]}
    />
  );
}
