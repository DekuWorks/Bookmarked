import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BookCover } from "../../../src/components/BookCover";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { SavedPill } from "../../../src/components/SavedPill";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { getBooksInSeries } from "../../../src/services/series";
import { useAuthStore } from "../../../src/store/authStore";

export default function SeriesScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const seriesName = decodeURIComponent(String(name ?? ""));
  const userId = useAuthStore((s) => s.user?.id);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["series", seriesName, userId],
    queryFn: () => getBooksInSeries(seriesName, userId),
    enabled: Boolean(seriesName),
  });

  const data = query.data;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={data?.name || seriesName || "Series"} fallbackHref="/(app)/search" />
      {query.isLoading ? (
        <LoadingState message="Loading series…" />
      ) : !data || data.books.length === 0 ? (
        <EmptyState
          title="No books found"
          description="We couldn't find other books in this series yet."
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
          <Text className="text-ink-muted">
            {data.books.length} books · {data.inLibraryCount} in your library · {data.readCount} read
          </Text>
          {data.books.map((book) => (
            <Pressable
              key={book.id}
              onPress={() => router.push(`/book/${book.id}`)}
              className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-3 active:opacity-80"
            >
              {book.series_position != null ? (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                  <Text className="text-xs font-bold text-puce-red">{book.series_position}</Text>
                </View>
              ) : null}
              <BookCover
                url={book.cover_url}
                title={book.title}
                sizeClassName="w-12 h-16"
                saved={Boolean(book.shelf_status)}
                badgeSize="small"
              />
              <View className="flex-1">
                <Text className="font-semibold text-ink" numberOfLines={2}>
                  {book.title}
                </Text>
                {book.author ? (
                  <Text className="text-xs text-ink-muted" numberOfLines={1}>
                    {book.author}
                  </Text>
                ) : null}
                {book.entry_type && book.entry_type !== "main" ? (
                  <Text className="mt-1 self-start rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium capitalize text-puce-red">
                    {book.entry_type.replaceAll("_", " ")}
                  </Text>
                ) : null}
                {book.shelf_status ? (
                  <View className="mt-1 flex-row">
                    <SavedPill shelf={book.shelf_status} />
                  </View>
                ) : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
