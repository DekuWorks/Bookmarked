import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { customShelfPath } from "../../lib/libraryRoutes";
import type { CustomShelfGroup } from "../../services/customShelves";
import { ShelfTitleRow } from "../ShelfTitleRow";
import { BookSpine } from "./BookSpine";
import { LibraryCoverGrid } from "./LibraryCoverGrid";

type Props = {
  shelf: CustomShelfGroup;
  view: "bookshelf" | "grid";
};

export function CustomShelfSection({ shelf, view }: Props) {
  const router = useRouter();

  return (
    <View className="overflow-hidden rounded-2xl border border-brand-border bg-surface shadow-md">
      <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <ShelfTitleRow
            iconKey={shelf.icon_key}
            title={shelf.name}
            size="small"
            titleClassName="text-base font-bold text-puce-red"
          />
          <Text className="text-sm font-normal text-ink-muted">({shelf.items.length})</Text>
        </View>
        <Pressable
          onPress={() => router.push(customShelfPath(shelf.slug))}
          className="active:opacity-70"
        >
          <Text className="text-sm font-medium text-primary-dark">View Shelf</Text>
        </Pressable>
      </View>

      {shelf.items.length === 0 ? (
        <Text className="px-4 py-6 text-center text-sm text-ink-muted">No books on this shelf yet.</Text>
      ) : view === "bookshelf" ? (
        <View className="bg-primary/5 px-4 pb-1 pt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-end gap-3 pb-2">
              {shelf.items.map((item) => (
                <BookSpine
                  key={item.id}
                  bookId={item.books?.id}
                  title={item.books?.title}
                  author={item.books?.author}
                  coverUrl={item.books?.cover_url}
                  pageCount={item.books?.page_count}
                  saved
                />
              ))}
            </View>
          </ScrollView>
          <View className="h-3 rounded-b-2xl bg-puce-red/20" />
        </View>
      ) : (
        <View className="p-4">
          <LibraryCoverGrid
            items={shelf.items.map((item) => ({
              id: item.id,
              bookId: item.books?.id,
              title: item.books?.title,
              author: item.books?.author,
              coverUrl: item.books?.cover_url,
            }))}
          />
        </View>
      )}
    </View>
  );
}
