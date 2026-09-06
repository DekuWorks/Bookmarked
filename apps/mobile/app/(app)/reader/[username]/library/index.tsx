import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CoverTile } from "../../../../../src/components/CoverTile";
import { EmptyState } from "../../../../../src/components/EmptyState";
import { FollowStats } from "../../../../../src/components/FollowStats";
import { LoadingState } from "../../../../../src/components/LoadingState";
import { ScreenHeader } from "../../../../../src/components/ScreenHeader";
import { SectionCard } from "../../../../../src/components/SectionCard";
import { useFollowCounts } from "../../../../../src/hooks/useFollows";
import {
  readerLibraryShelfPath,
  readerProfilePath,
} from "../../../../../src/lib/readerProfile";
import {
  buildFullShelves,
  getUserLibraryBooks,
} from "../../../../../src/services/library";
import { filterPublicLibraryBooks } from "../../../../../../../packages/utils/publicLibraryVisibility";
import { useAuthStore } from "../../../../../src/store/authStore";
import { useIsFollowing } from "../../../../../src/hooks/useFollows";
import { getProfileByUsername } from "../../../../../src/services/profile";

export default function ReaderLibraryScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const handle = decodeURIComponent(String(username ?? "")).replace(/^@/, "");
  const router = useRouter();

  const profileQuery = useQuery({
    queryKey: ["reader-profile", handle],
    queryFn: () => getProfileByUsername(handle),
    enabled: Boolean(handle),
  });
  const profile = profileQuery.data;
  const profilePath = readerProfilePath(profile?.username ?? handle);
  const viewerId = useAuthStore((s) => s.user?.id);
  const followingQuery = useIsFollowing(profile?.id, Boolean(profile?.id) && profile?.id !== viewerId);

  const shelvesQuery = useQuery({
    queryKey: ["reader-library-full", profile?.id, viewerId, followingQuery.data],
    queryFn: async () => {
      const books = await getUserLibraryBooks(profile!.id);
      return buildFullShelves(
        filterPublicLibraryBooks(books, {
          ownerId: profile!.id,
          viewerId,
          viewerFollowsOwner: Boolean(followingQuery.data),
          profile: profile ?? null,
        })
      );
    },
    enabled: Boolean(profile?.id),
  });

  const countsQuery = useFollowCounts(profile?.id);

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Library" />
        <LoadingState message="Loading library…" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Library" />
        <EmptyState title="Reader not found" description="This profile may be private or removed." />
      </View>
    );
  }

  const displayName =
    profile.display_name?.trim() || profile.username?.trim() || "Reader";
  const shelves = (shelvesQuery.data ?? []).filter((shelf) => shelf.items.length > 0);
  const libraryUsername = profile.username ?? handle;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={`${displayName}'s library`} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        <Pressable onPress={() => router.push(profilePath)} className="active:opacity-70">
          <Text className="text-sm text-primary-dark">← {displayName}&apos;s profile</Text>
        </Pressable>

        <View>
          <Text className="text-2xl font-bold text-puce-red">{displayName}&apos;s library</Text>
          <Text className="mt-1 text-sm text-ink-muted">
            Public shelves this reader has chosen to share.
          </Text>
          {countsQuery.data ? (
            <View className="mt-3">
              <FollowStats
                counts={countsQuery.data}
                onFollowersPress={() => router.push(`${profilePath}/followers`)}
                onFollowingPress={() => router.push(`${profilePath}/following`)}
                size="sm"
              />
            </View>
          ) : null}
        </View>

        {shelvesQuery.isLoading ? (
          <LoadingState message="Loading shelves…" />
        ) : shelves.length === 0 ? (
          <Text className="rounded-2xl border border-dashed border-brand-border bg-background px-4 py-10 text-center text-sm text-ink-muted">
            This reader has no public shelves to show.
          </Text>
        ) : (
          shelves.map((shelf) => (
            <SectionCard
              key={shelf.slug}
              title={shelf.title}
              shelfIconId={shelf.status}
              action={
                <Pressable
                  onPress={() =>
                    router.push(readerLibraryShelfPath(libraryUsername, shelf.slug))
                  }
                  className="active:opacity-70"
                >
                  <Text className="text-sm font-medium text-primary-dark">
                    {shelf.items.length} book{shelf.items.length === 1 ? "" : "s"}
                  </Text>
                </Pressable>
              }
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {shelf.items.map((item) => (
                    <CoverTile
                      key={item.id}
                      bookId={item.books?.id}
                      title={item.books?.title}
                      author={item.books?.author}
                      coverUrl={item.books?.cover_url}
                      widthClassName="w-20"
                      coverSizeClassName="w-20 h-28"
                    />
                  ))}
                </View>
              </ScrollView>
            </SectionCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}
