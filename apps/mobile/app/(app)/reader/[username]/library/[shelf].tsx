import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CoverTile } from "../../../../../src/components/CoverTile";
import { EmptyState } from "../../../../../src/components/EmptyState";
import { LoadingState } from "../../../../../src/components/LoadingState";
import { ScreenHeader } from "../../../../../src/components/ScreenHeader";
import { getShelfConfigBySlug } from "../../../../../src/constants/shelves";
import { ShelfIcon } from "../../../../../src/components/ShelfIcon";
import { ShelfTitleRow } from "../../../../../src/components/ShelfTitleRow";
import {
  readerLibraryPath,
  readerProfilePath,
} from "../../../../../src/lib/readerProfile";
import {
  buildFullShelves,
  getUserLibraryBooks,
} from "../../../../../src/services/library";
import { getProfileByUsername } from "../../../../../src/services/profile";

export default function ReaderLibraryShelfScreen() {
  const { username, shelf: shelfSlugParam } = useLocalSearchParams<{
    username: string;
    shelf: string;
  }>();
  const handle = decodeURIComponent(String(username ?? "")).replace(/^@/, "");
  const shelfSlug = decodeURIComponent(String(shelfSlugParam ?? ""));
  const config = getShelfConfigBySlug(shelfSlug);
  const router = useRouter();

  const profileQuery = useQuery({
    queryKey: ["reader-profile", handle],
    queryFn: () => getProfileByUsername(handle),
    enabled: Boolean(handle),
  });
  const profile = profileQuery.data;

  const shelfQuery = useQuery({
    queryKey: ["reader-library-shelf", profile?.id, shelfSlug],
    queryFn: async () => {
      const shelves = buildFullShelves(await getUserLibraryBooks(profile!.id));
      return shelves.find((entry) => entry.status === config!.status) ?? null;
    },
    enabled: Boolean(profile?.id && config),
  });

  if (!config) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Shelf" />
        <EmptyState title="Shelf not found" description="That shelf doesn't exist." />
      </View>
    );
  }

  if (profileQuery.isLoading || shelfQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={config.title} />
        <LoadingState message="Loading shelf…" />
      </View>
    );
  }

  if (!profile || !shelfQuery.data) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={config.title} />
        <EmptyState title="Shelf not found" description="No books on this shelf yet." />
      </View>
    );
  }

  const displayName =
    profile.display_name?.trim() || profile.username?.trim() || "Reader";
  const libraryUsername = profile.username ?? handle;
  const shelf = shelfQuery.data;
  const profilePath = readerProfilePath(libraryUsername);
  const libraryPath = readerLibraryPath(libraryUsername);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={config.title} left={<ShelfIcon id={config.status} size="small" labeled />} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        <Text className="text-sm text-ink-muted">
          <Text className="text-primary-dark" onPress={() => router.push(profilePath)}>
            {displayName}&apos;s profile
          </Text>
          {" · "}
          <Text className="text-primary-dark" onPress={() => router.push(libraryPath)}>
            Library
          </Text>
        </Text>

        <View>
          <ShelfTitleRow id={config.status} title={config.title} titleClassName="text-2xl font-bold text-puce-red" />
          <Text className="mt-1 text-sm text-ink-muted">
            {displayName}&apos;s {config.title.toLowerCase()} shelf
          </Text>
          <Text className="mt-2 text-sm font-medium text-ink">
            {shelf.items.length} book{shelf.items.length === 1 ? "" : "s"}
          </Text>
        </View>

        {shelf.items.length === 0 ? (
          <Text className="rounded-2xl border border-dashed border-brand-border bg-background px-4 py-10 text-center text-sm text-ink-muted">
            No books on this shelf.
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {shelf.items.map((item) => (
              <CoverTile
                key={item.id}
                bookId={item.books?.id}
                title={item.books?.title}
                author={item.books?.author}
                coverUrl={item.books?.cover_url}
                widthClassName="w-24"
                coverSizeClassName="w-24 h-36"
              />
            ))}
          </View>
        )}

        <Pressable onPress={() => router.push(libraryPath)} className="self-center active:opacity-70">
          <Text className="text-sm font-medium text-primary-dark">← Back to library</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
