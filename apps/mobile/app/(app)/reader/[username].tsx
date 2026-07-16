import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Avatar } from "../../../src/components/Avatar";
import { BookCover } from "../../../src/components/BookCover";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { ProfanityBlur } from "../../../src/components/ProfanityBlur";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { getFollowCounts, followUser, isFollowing, unfollowUser } from "../../../src/services/follows";
import { getUserLibraryBooks, groupBooksByShelf } from "../../../src/services/library";
import { createDirectConversation } from "../../../src/services/messages";
import { getProfileByUsername } from "../../../src/services/profile";
import { useAuthStore } from "../../../src/store/authStore";

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

  const shelvesQuery = useQuery({
    queryKey: ["reader-library", reader?.id],
    queryFn: async () => groupBooksByShelf(await getUserLibraryBooks(reader!.id)),
    enabled: Boolean(reader?.id),
  });

  const countsQuery = useQuery({
    queryKey: ["follow-counts", reader?.id],
    queryFn: () => getFollowCounts(reader!.id),
    enabled: Boolean(reader?.id),
  });

  const followingQuery = useQuery({
    queryKey: ["is-following", viewerId, reader?.id],
    queryFn: () => isFollowing(viewerId as string, reader!.id),
    enabled: Boolean(viewerId) && Boolean(reader?.id) && !isSelf,
  });

  async function toggleFollow() {
    if (!reader) return;
    const result = followingQuery.data
      ? await unfollowUser(reader.id)
      : await followUser(reader.id);
    if (result.error) Alert.alert("Error", result.error);
    queryClient.invalidateQueries({ queryKey: ["is-following", viewerId, reader.id] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts", reader.id] });
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
  const shelves = (shelvesQuery.data ?? []).filter((shelf) => shelf.items.length > 0);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={`@${reader.username ?? handle}`} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        <View className="items-center">
          <Avatar url={reader.avatar_url} name={name} size={72} />
          <Text className="mt-2 text-xl font-bold text-ink">{name}</Text>
          {reader.username ? <Text className="text-ink-muted">@{reader.username}</Text> : null}
          {reader.bio ? (
            <ProfanityBlur text={reader.bio} className="mt-2 w-full">
              <Text className="text-center leading-5 text-ink">{reader.bio}</Text>
            </ProfanityBlur>
          ) : null}
          {countsQuery.data ? (
            <Text className="mt-2 text-xs text-ink-muted">
              {countsQuery.data.followers} followers · {countsQuery.data.following} following
            </Text>
          ) : null}

          {!isSelf ? (
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
          ) : null}
        </View>

        {shelves.length === 0 ? (
          <Text className="text-center text-ink-muted">No public books on their shelves yet.</Text>
        ) : (
          shelves.map((shelf) => (
            <View key={shelf.slug}>
              <Text className="mb-2 text-base font-bold text-puce-red">
                {shelf.emoji} {shelf.title} ({shelf.items.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {shelf.items.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => item.books && router.push(`/book/${item.books.id}`)}
                      className="w-20 active:opacity-80"
                    >
                      <BookCover
                        url={item.books?.cover_url}
                        title={item.books?.title}
                        sizeClassName="w-20 h-28"
                        saved
                        ribbonSize={14}
                      />
                      <Text className="mt-1 text-xs text-ink" numberOfLines={2}>
                        {item.books?.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
