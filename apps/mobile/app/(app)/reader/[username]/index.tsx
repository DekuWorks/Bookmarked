import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Avatar } from "../../../../src/components/Avatar";
import { BookCover } from "../../../../src/components/BookCover";
import { ClubCard } from "../../../../src/components/ClubCard";
import { EmptyState } from "../../../../src/components/EmptyState";
import { FeedCard } from "../../../../src/components/FeedCard";
import { FeedPostCard } from "../../../../src/components/FeedPostCard";
import { FollowStats } from "../../../../src/components/FollowStats";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ProfanityBlur } from "../../../../src/components/ProfanityBlur";
import { ProfileShelfPreview } from "../../../../src/components/ProfileShelfPreview";
import { ReadingStreakCard } from "../../../../src/components/ReadingStreakCard";
import { ScreenHeader } from "../../../../src/components/ScreenHeader";
import { SectionCard } from "../../../../src/components/SectionCard";
import { useFollowCounts, useIsFollowing, useMutuals } from "../../../../src/hooks/useFollows";
import { useReaderActivity } from "../../../../src/hooks/useFeed";
import {
  readerLibraryPath,
  readerProfilePath,
} from "../../../../src/lib/readerProfile";
import { getUserClubs } from "../../../../src/services/bookClubs";
import { followUser, unfollowUser } from "../../../../src/services/follows";
import { createDirectConversation } from "../../../../src/services/messages";
import { listPostsByUser } from "../../../../src/services/posts";
import { getProfileByUsername } from "../../../../src/services/profile";
import {
  computeReadingStreak,
  fetchReadingStreakTimestamps,
} from "../../../../src/services/readingInsights";
import { listProfileNotesForUser } from "../../../../src/services/readingNotes";
import type { PostEntry } from "../../../../src/services/socialFeed";
import { useAuthStore } from "../../../../src/store/authStore";
import { timeAgo } from "../../../../src/utils";

const POSTS_PREVIEW_LIMIT = 3;
const NOTES_PREVIEW_LIMIT = 5;

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
  const activityQuery = useReaderActivity(reader?.id);

  const streakQuery = useQuery({
    queryKey: ["reader-streak", reader?.id],
    queryFn: async () =>
      computeReadingStreak(await fetchReadingStreakTimestamps(reader!.id)),
    enabled: Boolean(reader?.id),
  });

  const notesQuery = useQuery({
    queryKey: ["reader-notes", reader?.id, isSelf],
    queryFn: () =>
      listProfileNotesForUser(reader!.id, {
        isOwnProfile: isSelf,
        limit: NOTES_PREVIEW_LIMIT,
      }),
    enabled: Boolean(reader?.id),
  });

  const clubsQuery = useQuery({
    queryKey: ["reader-clubs", reader?.id, viewerId],
    queryFn: () => getUserClubs(reader!.id, viewerId!),
    enabled: Boolean(reader?.id && viewerId),
  });

  const canViewPosts = Boolean(isSelf || followingQuery.data);
  const postsLocked =
    !isSelf && followingQuery.isFetched && !followingQuery.data;
  const postsQuery = useQuery({
    queryKey: ["reader-posts", reader?.id, viewerId, canViewPosts],
    queryFn: () => listPostsByUser(reader!.id, viewerId!, POSTS_PREVIEW_LIMIT + 1),
    enabled: Boolean(reader?.id && viewerId && canViewPosts),
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
    queryClient.invalidateQueries({ queryKey: ["reader-posts", reader.id] });
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
  const posts = postsQuery.data ?? [];
  const visiblePosts = posts.slice(0, POSTS_PREVIEW_LIMIT);
  const notes = notesQuery.data ?? [];
  const clubs = clubsQuery.data ?? [];
  const activity = activityQuery.data ?? [];

  const postEntries: PostEntry[] = visiblePosts.map((post) => ({
    kind: "post",
    id: post.id,
    createdAt: post.created_at,
    author: {
      id: post.author.id,
      name: post.author.display_name?.trim() || post.author.username?.trim() || "Reader",
      username: post.author.username,
      avatarUrl: post.author.avatar_url,
    },
    post,
  }));

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={`@${reader.username ?? handle}`} />
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
          <Text className="mb-3 text-base font-bold text-puce-red">Shelves</Text>
          <ProfileShelfPreview
            ownerId={reader.id}
            username={reader.username}
            isOwnProfile={Boolean(isSelf)}
            previewLimit={3}
          />
        </View>

        <SectionCard title="Reading Notes">
          {notesQuery.isLoading ? (
            <Text className="text-sm text-ink-muted">Loading notes…</Text>
          ) : notes.length === 0 ? (
            <Text className="text-sm text-ink-muted">
              {isSelf
                ? "Your public reading notes will show here."
                : "No visible reading notes yet."}
            </Text>
          ) : (
            <View className="gap-3">
              {notes.map((note) => (
                <Pressable
                  key={note.id}
                  disabled={!note.book?.id}
                  onPress={() => note.book?.id && router.push(`/book/${note.book.id}`)}
                  className="flex-row gap-3 active:opacity-80"
                >
                  <BookCover
                    url={note.book?.cover_url}
                    title={note.book?.title}
                    sizeClassName="w-10 h-14"
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="text-xs text-ink-muted">{timeAgo(note.created_at)}</Text>
                    {note.quote ? (
                      <Text className="mt-0.5 text-sm italic text-ink" numberOfLines={2}>
                        “{note.quote}”
                      </Text>
                    ) : null}
                    {note.note ? (
                      <Text className="mt-0.5 text-sm text-ink" numberOfLines={2}>
                        {note.note}
                      </Text>
                    ) : null}
                    {note.book?.title ? (
                      <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
                        {note.book.title}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </SectionCard>

        <SectionCard title="Book Clubs">
          {clubsQuery.isLoading ? (
            <Text className="text-sm text-ink-muted">Loading book clubs…</Text>
          ) : clubs.length === 0 ? (
            <Text className="text-sm text-ink-muted">
              {isSelf ? (
                <>
                  You haven&apos;t joined any book clubs yet.{" "}
                  <Text
                    className="font-medium text-primary-dark"
                    onPress={() => router.push("/clubs")}
                  >
                    Discover clubs
                  </Text>
                </>
              ) : (
                "No public book clubs yet."
              )}
            </Text>
          ) : (
            <View>
              {clubs.slice(0, 5).map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </View>
          )}
        </SectionCard>

        <SectionCard title="Posts">
          {postsLocked ? (
            <View className="rounded-xl border border-dashed border-brand-border bg-background px-4 py-8">
              <Text className="text-center font-medium text-puce-red">Posts are for followers</Text>
              <Text className="mt-2 text-center text-sm text-ink-muted">
                Follow {name} to see their posts here.
              </Text>
            </View>
          ) : postsQuery.isLoading || (!isSelf && followingQuery.isLoading) ? (
            <Text className="text-sm text-ink-muted">Loading posts…</Text>
          ) : postEntries.length === 0 ? (
            <Text className="text-sm text-ink-muted">
              {isSelf
                ? "Share a reading thought from your feed."
                : `${name} hasn't shared any posts yet.`}
            </Text>
          ) : (
            <View>
              {postEntries.map((entry) => (
                <FeedPostCard key={entry.id} entry={entry} />
              ))}
              {posts.length > POSTS_PREVIEW_LIMIT ? (
                <Pressable
                  onPress={() => router.push("/feed")}
                  className="mt-1 self-center active:opacity-70"
                >
                  <Text className="text-sm font-medium text-primary-dark">See more posts</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </SectionCard>

        <SectionCard title="Recent activity">
          {activityQuery.isLoading ? (
            <Text className="text-sm text-ink-muted">Loading activity…</Text>
          ) : activity.length === 0 ? (
            <Text className="text-sm text-ink-muted">
              {isSelf
                ? "Your public activity will show here. Add books and write reviews to share with followers."
                : "No visible activity yet."}
            </Text>
          ) : (
            <View>
              {activity.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </SectionCard>

        {!isSelf && reader.username ? (
          <Pressable
            onPress={() => router.push(readerLibraryPath(reader.username!))}
            className="self-center active:opacity-70"
          >
            <Text className="text-sm font-medium text-primary-dark">
              View {name}&apos;s full library →
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
