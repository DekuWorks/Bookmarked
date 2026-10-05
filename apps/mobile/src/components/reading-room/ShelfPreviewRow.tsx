import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BookCover } from "../BookCover";
import type { LibraryBookRow } from "../../services/library";
import { withOriginQuery } from "../../../../../packages/utils/navigationOrigin";
import { bookCountLabel } from "../../../../../packages/utils/overviewShelfPreview";

type Props = {
  title: string;
  count: number;
  items: LibraryBookRow[];
};

export function ShelfPreviewRow({ title, count, items }: Props) {
  const router = useRouter();

  return (
    <View className="flex-row items-end gap-3">
      <View className="w-24 pb-3">
        <Text className="font-semibold text-puce-red">{title}</Text>
        <Text className="text-sm text-ink-muted">{bookCountLabel(count)}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <View className="min-h-16 flex-row items-end gap-2 bg-primary/5 px-2 pt-2">
          {items.map((item) => {
            const book = item.books;
            const bookTitle = book?.title ?? "Untitled";
            if (!book?.id) return null;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="link"
                accessibilityLabel={`${bookTitle} cover`}
                onPress={() =>
                  router.push(
                    withOriginQuery(`/book/${book.id}`, { origin: "reading_room_overview" }) as never
                  )
                }
              >
                <BookCover
                  url={book.cover_url}
                  title={bookTitle}
                  resizeMode="contain"
                  accessible={false}
                  sizeStyle={{ width: 44, height: 66 }}
                />
              </Pressable>
            );
          })}
          {count === 0 ? (
            <Text className="pb-2 text-sm text-ink-muted">No books on this shelf yet.</Text>
          ) : null}
        </View>
        <LinearGradient
          colors={["#c4a882", "#a08060", "#8b6f52"]}
          style={{ height: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}
        />
      </View>
    </View>
  );
}
