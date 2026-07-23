import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Avatar } from "../../../../src/components/Avatar";
import { EmptyState } from "../../../../src/components/EmptyState";
import { FollowStats } from "../../../../src/components/FollowStats";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ProfanityBlur } from "../../../../src/components/ProfanityBlur";
import { ProfileShelfPreview } from "../../../../src/components/ProfileShelfPreview";
import { ReadingStreakCard } from "../../../../src/components/ReadingStreakCard";
import { ScreenHeader } from "../../../../src/components/ScreenHeader";
import { showProfileActions } from "../../../../src/components/ContentActions";
import { useFollowCounts, useIsFollowing, useMutuals } from "../../../../src/hooks/useFollows";
import {
  readerLibraryPath,
  readerProfilePath,
} from "../../../../src/lib/readerProfile";
import { followUser, unfollowUser } from "../../../../src/services/follows";
import { createDirectConversation } from "../../../../src/services/messages";
import { getProfileByUsername } from "../../../../src/services/profile";
import {
  computeReadingStreak,
  fetchReadingStreakTimestamps,
} from "../../../../src/services/readingInsights";
import { useAuthStore } from "../../../../src/store/authStore";

export default function ReaderScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const handle = decodeURIComponent(String(username ?? "")).replace(/^@/, "");
  const viewerId = useAuthStore((s) => s.user?.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["reader-profile", handle],
    queryFn: () => getProfileByUsername(handle),
    enabled: Boolean(handle),
  });
  const reader = profileQuery.data;
  const isSelf = reader?.id === viewerId;
  const readerPath = readerProfilePath(reader?.username ?? handle);

  const countsQuery = useFollowCounts(reader?.id);
  const mutualsQuery = useMutuals(reader?.id, !isSelf);
  const followingQuery = useIsFollowing(reader?.id, !isSelf);

  const streakQuery = useQuery({
    queryKey: ["reader-streak", reader?.id],
    queryFn: async () =>
      computeReadingStreak(await fetchReadingStreakTimestamps(reader!.id)),
    enabled: Boolean(reader?.id),
  });

  async function toggleFollow() {
    if (!reader || !viewerId) return;
    const result = followingQuery.data
      ? await unfollowUser(reader.id)
      : await followUser(reader.id);
    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["is-following", viewerId, reader.id] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts", reader.id] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts", viewerId] });
    queryClient.invalidateQueries({ queryKey: ["follow-list"] });
    queryClient.invalidateQueries({ queryKey: ["shared-following"] });
    queryClient.invalidateQueries({ queryKey: ["mutuals"] });
    queryClient.invalidateQueries({ queryKey: ["home-feed"] });
  }

  async function message() {
    if (!reader) return;
    const result = await createDirectConversation(reader.id);
    if (result.error || !result.conversationId) {
      Alert.alert("Couldn't open chat", result.error ?? "Please try again.");
      return;
    }
    router.push(`/messages/${result.conversationId}`);
  }

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Reader" />
        <LoadingState message="Loading profile…" />
      </View>
    );
  }

  if (!reader) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Reader" />
        <EmptyState title="Reader not found" description="This profile may be private or removed." />
      </View>
    );
  }

  const name = reader.display_name?.trim() || reader.username?.trim() || "Reader";
  const genres = reader.favorite_genres?.filter((g) => g.trim()) ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={`@${reader.username ?? handle}`}
        right={
          !isSelf ? (
            <Pressable
              onPress={() =>
                showProfileActions({
                  userId: reader.id,
                  userName: name,
                  onBlocked: () => router.back(),
                })
              }
              className="px-2 active:opacity-70"
            >
              <Text className="text-lg text-ink-muted">⋯</Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        <View className="items-center rounded-2xl border border-brand-border bg-surface p-5">
          <Avatar url={reader.avatar_url} name={name} size={72} />
          <Text className="mt-2 text-xl font-bold text-puce-red">{name}</Text>
          {reader.username ? <Text className="text-ink-muted">@{reader.username}</Text> : null}

          {isSelf ? (
            <Pressable
              onPress={() => router.push("/profile")}
              className="mt-3 rounded-full border border-brand-border px-5 py-2 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-puce-red">Edit profile</Text>
            </Pressable>
          ) : (
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={toggleFollow}
                className={`rounded-full px-5 py-2 ${
                  followingQuery.data ? "bg-primary/15" : "bg-puce-red"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    followingQuery.data ? "text-puce-red" : "text-white"
                  }`}
                >
                  {followingQuery.data ? "Following" : "Follow"}
                </Text>
              </Pressable>
              <Pressable onPress={message} className="rounded-full bg-primary/15 px-5 py-2">
                <Text className="text-sm font-semibold text-puce-red">Message</Text>
              </Pressable>
            </View>
          )}

          {reader.bio ? (
            <ProfanityBlur text={reader.bio} className="mt-4 w-full">
              <Text className="text-center leading-5 text-ink">{reader.bio}</Text>
            </ProfanityBlur>
          ) : null}

          {genres.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap justify-center gap-2">
              {genres.map((genre) => (
                <View key={genre} className="rounded-full bg-primary/20 px-3 py-1">
                  <Text className="text-xs font-medium text-puce-red">{genre}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {countsQuery.data ? (
            <View className="mt-4 items-center">
              <FollowStats
                counts={countsQuery.data}
                mutualsCount={isSelf ? undefined : (mutualsQuery.data?.length ?? 0)}
                onFollowersPress={() => router.push(`${readerPath}/followers`)}
                onFollowingPress={() => router.push(`${readerPath}/following`)}
                onMutualsPress={
                  isSelf ? undefined : () => router.push(`${readerPath}/mutuals`)
                }
                size="md"
              />
            </View>
          ) : null}

          {streakQuery.data ? (
            <View className="mt-4 w-full">
              <ReadingStreakCard streak={streakQuery.data} />
            </View>
          ) : null}
        </View>

        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-bold text-puce-red">Shelves</Text>
            {!isSelf && reader.username ? (
              <Pressable
                onPress={() => router.push(readerLibraryPath(reader.username!))}
                className="active:opacity-70"
              >
                <Text className="text-sm font-medium text-primary-dark">View full library</Text>
              </Pressable>
            ) : null}
          </View>
          <ProfileShelfPreview
            ownerId={reader.id}
            username={reader.username}
            isOwnProfile={Boolean(isSelf)}
            previewLimit={3}
          />
        </View>
      </ScrollView>
    </View>
  );
}
