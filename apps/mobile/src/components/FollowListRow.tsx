import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "./Avatar";
import { useToggleFollow } from "../hooks/useFollows";
import { readerProfilePath } from "../lib/readerProfile";
import type { FollowListUser } from "../services/follows";
import { useAuthStore } from "../store/authStore";

type Props = {
  user: FollowListUser;
};

export function FollowListRow({ user }: Props) {
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.user?.id);
  const displayName = user.display_name?.trim() || user.username?.trim() || "Reader";
  const username = user.username?.trim();
  const isSelf = user.id === viewerId;
  const { isFollowing, isLoading, toggle } = useToggleFollow(
    isSelf ? undefined : user.id,
    user.viewerFollows
  );

  function openProfile() {
    if (!username) return;
    router.push(readerProfilePath(username));
  }

  async function onToggleFollow() {
    const result = await toggle();
    if (result?.error) Alert.alert("Error", result.error);
  }

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface px-3 py-3">
      <Pressable
        onPress={openProfile}
        disabled={!username}
        accessibilityRole="link"
        accessibilityLabel={`View ${displayName}'s profile`}
        className="active:opacity-80"
      >
        <Avatar url={user.avatar_url} name={displayName} size={44} />
      </Pressable>

      <Pressable
        onPress={openProfile}
        disabled={!username}
        className="min-w-0 flex-1 active:opacity-80"
      >
        <Text className="font-semibold text-puce-red" numberOfLines={1}>
          {displayName}
        </Text>
        {username ? (
          <Text className="text-sm text-ink-muted" numberOfLines={1}>
            @{username}
          </Text>
        ) : null}
        {user.isMutual ? (
          <Text className="mt-1 text-xs font-medium text-royal-orange">Mutual</Text>
        ) : user.followsViewer && !user.viewerFollows ? (
          <Text className="mt-1 text-xs text-ink-muted">Follows you</Text>
        ) : null}
      </Pressable>

      {!isSelf && username ? (
        <Pressable
          onPress={onToggleFollow}
          disabled={isLoading}
          className={`rounded-full px-4 py-2 ${
            isFollowing ? "bg-primary/15" : "bg-puce-red"
          } ${isLoading ? "opacity-60" : ""}`}
        >
          <Text
            className={`text-sm font-semibold ${
              isFollowing ? "text-puce-red" : "text-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
