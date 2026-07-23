import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { ProfanityBlur } from "./ProfanityBlur";
import { ShelfBadge } from "./ShelfBadge";
import { followUser, unfollowUser } from "../services/follows";
import type { ReaderSearchResult } from "../services/feedSearch";

type Props = {
  reader: ReaderSearchResult;
};

export function ReaderSearchCard({ reader }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(reader.isFollowing);
  const [busy, setBusy] = useState(false);

  const displayName =
    reader.display_name?.trim() || reader.username?.trim() || "Reader";
  const username = reader.username?.trim();
  const profilePath = username ? `/reader/${encodeURIComponent(username)}` : null;

  async function toggleFollow() {
    if (!username || reader.isSelf) return;
    setBusy(true);
    const result = following
      ? await unfollowUser(reader.id)
      : await followUser(reader.id);
    setBusy(false);
    if (result.error) {
      Alert.alert("Couldn't update follow", result.error);
      return;
    }
    setFollowing(!following);
  }

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface px-4 py-3">
      <Pressable
        disabled={!profilePath}
        onPress={() => profilePath && router.push(profilePath)}
        className="shrink-0 active:opacity-80"
        accessibilityRole={profilePath ? "link" : undefined}
        accessibilityLabel={profilePath ? `View ${displayName}'s profile` : undefined}
      >
        <Avatar url={reader.avatar_url} name={displayName} size={48} />
      </Pressable>

      <View className="min-w-0 flex-1">
        <Pressable
          disabled={!profilePath}
          onPress={() => profilePath && router.push(profilePath)}
          className="active:opacity-80"
        >
          <Text className="font-semibold text-puce-red" numberOfLines={1}>
            {displayName}
          </Text>
          {username ? (
            <Text className="text-sm text-ink-muted">@{username}</Text>
          ) : null}
          {reader.bio ? (
            <ProfanityBlur text={reader.bio} className="mt-1">
              <Text className="text-sm text-ink-muted" numberOfLines={2}>
                {reader.bio}
              </Text>
            </ProfanityBlur>
          ) : null}
          {reader.favorite_genres?.length ? (
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {reader.favorite_genres.slice(0, 3).map((genre) => (
                <ShelfBadge key={genre} label={genre} />
              ))}
            </View>
          ) : null}
        </Pressable>
        {profilePath ? (
          <Pressable onPress={() => router.push(profilePath)} className="mt-2 active:opacity-80">
            <Text className="text-xs font-medium text-primary-dark">View profile</Text>
          </Pressable>
        ) : null}
      </View>

      {!reader.isSelf && username ? (
        <Button
          title={following ? "Following" : "Follow"}
          variant={following ? "ghost" : "secondary"}
          loading={busy}
          onPress={() => void toggleFollow()}
          className="min-h-[40px] px-3 py-2"
        />
      ) : null}
    </View>
  );
}
