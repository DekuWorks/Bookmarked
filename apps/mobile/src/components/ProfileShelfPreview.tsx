import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { CoverTile } from "./CoverTile";
import { LoadingState } from "./LoadingState";
import { SectionCard } from "./SectionCard";
import { SHELF_CONFIG } from "../constants/shelves";
import { readerLibraryPath } from "../lib/readerProfile";
import {
  buildShelfPreview,
  getUserLibraryBooks,
  type ShelfGroup,
} from "../services/library";

type Props = {
  ownerId: string;
  username: string | null;
  isOwnProfile: boolean;
  previewLimit?: number;
};

export function ProfileShelfPreview({
  ownerId,
  username,
  isOwnProfile,
  previewLimit = 3,
}: Props) {
  const router = useRouter();
  const shelvesQuery = useQuery({
    queryKey: ["reader-shelf-preview", ownerId, previewLimit],
    queryFn: async () => buildShelfPreview(await getUserLibraryBooks(ownerId), previewLimit),
  });

  const shelves = shelvesQuery.data;
  const seeMoreHref = isOwnProfile
    ? "/library"
    : username
      ? readerLibraryPath(username)
      : null;

  if (shelvesQuery.isLoading || shelves == null) {
    return <LoadingState message="Loading shelves…" />;
  }

  const visibleShelves = shelves.filter((shelf) => shelf.items.length > 0);

  if (!visibleShelves.length) {
    return (
      <View className="rounded-2xl border border-dashed border-brand-border bg-background px-4 py-8">
        <Text className="text-center text-sm text-ink-muted">
          {isOwnProfile
            ? "Your public shelves are empty or set to private."
            : "No public shelves to show yet."}
        </Text>
        {isOwnProfile ? (
          <Pressable
            onPress={() => router.push("/search")}
            className="mt-4 self-center rounded-full bg-puce-red px-5 py-2 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">Find books</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View className="gap-4">
      {SHELF_CONFIG.map((config) => {
        const shelf = visibleShelves.find((entry) => entry.status === config.status);
        if (!shelf) return null;
        return <ShelfPreviewRow key={shelf.status} shelf={shelf} seeMoreHref={seeMoreHref} />;
      })}

      {seeMoreHref ? (
        <Pressable
          onPress={() => router.push(seeMoreHref)}
          className="self-center rounded-full border border-brand-border bg-surface px-5 py-2 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-puce-red">
            {isOwnProfile ? "Open library" : "View full library"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ShelfPreviewRow({
  shelf,
  seeMoreHref,
}: {
  shelf: ShelfGroup;
  seeMoreHref: string | null;
}) {
  const router = useRouter();

  return (
    <SectionCard
      title={`${shelf.emoji} ${shelf.title}`}
      action={
        seeMoreHref ? (
          <Pressable onPress={() => router.push(seeMoreHref)} className="active:opacity-70">
            <Text className="text-sm font-medium text-primary-dark">See more</Text>
          </Pressable>
        ) : null
      }
    >
      <View className="flex-row flex-wrap gap-3">
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
    </SectionCard>
  );
}
