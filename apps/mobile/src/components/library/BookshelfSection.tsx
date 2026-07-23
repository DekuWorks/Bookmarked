import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { libraryShelfPath } from "../../lib/libraryRoutes";
import type { LibraryBookRow } from "../../services/library";
import { BookSpine } from "./BookSpine";

type Props = {
  title: string;
  emoji: string;
  slug: string;
  items: LibraryBookRow[];
  showHeaderLink?: boolean;
};

export function BookshelfSection({
  title,
  emoji,
  slug,
  items,
  showHeaderLink = true,
}: Props) {
  const router = useRouter();

  return (
    <View className="overflow-hidden rounded-2xl border border-brand-border bg-surface shadow-md">
      <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3">
        <Text className="text-base font-bold text-puce-red">
          {emoji} {title}{" "}
          <Text className="text-sm font-normal text-ink-muted">({items.length})</Text>
        </Text>
        {showHeaderLink ? (
          <Pressable
            onPress={() => router.push(libraryShelfPath(slug))}
            className="active:opacity-70"
          >
            <Text className="text-sm font-medium text-primary-dark">View shelf</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="bg-primary/5 px-4 pb-1 pt-4">
        {items.length === 0 ? (
          <Text className="pb-4 text-center text-sm text-ink-muted">No books on this shelf yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-end gap-2 pb-2">
              {items.map((item) => (
                <BookSpine
                  key={item.id}
                  bookId={item.books?.id}
                  title={item.books?.title}
                  author={item.books?.author}
                  coverUrl={item.books?.cover_url}
                  pageCount={item.books?.page_count}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
      <View className="h-3 rounded-b-2xl bg-puce-red/20" />
    </View>
  );
}
