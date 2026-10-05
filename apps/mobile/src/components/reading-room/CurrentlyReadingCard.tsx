import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BookCover } from "../BookCover";
import { ProgressBar } from "../ProgressBar";
import type { LibraryBookRow } from "../../services/library";
import { withOriginQuery } from "../../../../../packages/utils/navigationOrigin";
import { currentlyReadingProgressLabel } from "../../../../../packages/utils/overviewShelfPreview";

type Props = {
  item: LibraryBookRow;
};

export function CurrentlyReadingCard({ item }: Props) {
  const router = useRouter();
  const book = item.books;
  const title = book?.title ?? "Untitled";
  const progress = currentlyReadingProgressLabel({
    progressPages: item.progress_pages,
    totalPages: item.total_pages,
    pageCount: book?.page_count ?? null,
    progressPercent: item.progress_percent,
  });

  return (
    <View className="min-h-[220px] flex-row gap-3 rounded-2xl border border-brand-border bg-background p-3">
      <BookCover
        url={book?.cover_url}
        title={title}
        resizeMode="contain"
        sizeStyle={{ width: 96, height: 144 }}
        accessibilityLabel={`${title} cover`}
      />
      <View className="min-w-0 flex-1">
        <Text className="text-lg font-semibold text-puce-red" numberOfLines={2}>
          {title}
        </Text>
        {book?.author ? (
          <Text className="mt-1 text-sm text-ink-muted" numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}
        <Text className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Progress
        </Text>
        <Text className="mt-1 text-sm font-semibold text-puce-red">{progress.value}</Text>
        <View
          className="mt-2"
          accessibilityRole="progressbar"
          accessibilityLabel={`Progress, ${progress.value}`}
        >
          <ProgressBar percent={progress.percent} />
        </View>
        {book?.id ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Update Progress"
            onPress={() =>
              router.push(
                withOriginQuery(`/book/${book.id}`, { origin: "reading_room_overview" }) as never
              )
            }
            className="mt-4 min-h-11 items-center justify-center rounded-xl bg-primary px-3 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">Update Progress</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
