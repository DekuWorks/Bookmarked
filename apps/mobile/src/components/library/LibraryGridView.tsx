import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { CoverTile } from "../CoverTile";
import { ShelfTitleRow } from "../ShelfTitleRow";
import { libraryShelfPath } from "../../lib/libraryRoutes";
import type { ShelfGroup } from "../../services/library";

type Props = {
  shelves: ShelfGroup[];
  showHeaderLink?: boolean;
};

export function LibraryGridView({ shelves, showHeaderLink = true }: Props) {
  const router = useRouter();

  return (
    <View className="gap-4">
      {shelves.map((shelf) => (
        <View
          key={shelf.slug}
          className="rounded-2xl border border-brand-border bg-surface p-4 shadow-md"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View className="min-w-0 flex-1 flex-row items-center gap-2">
              <ShelfTitleRow id={shelf.status} title={shelf.title} />
              <Text className="text-sm font-normal text-ink-muted">({shelf.items.length})</Text>
            </View>
            {showHeaderLink ? (
              <Pressable
                onPress={() => router.push(libraryShelfPath(shelf.slug))}
                className="active:opacity-70"
              >
                <Text className="text-sm font-medium text-primary-dark">View shelf</Text>
              </Pressable>
            ) : null}
          </View>

          {shelf.items.length === 0 ? (
            <Text className="text-sm text-ink-muted">No books on this shelf yet.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {shelf.items.map((item) => (
                <CoverTile
                  key={item.id}
                  bookId={item.books?.id}
                  title={item.books?.title}
                  author={item.books?.author}
                  coverUrl={item.books?.cover_url}
                  format={item.books?.format}
                  widthClassName="w-[23%]"
                  coverSizeClassName="w-full aspect-[2/3]"
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
