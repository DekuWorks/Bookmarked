import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BookCover } from "./BookCover";
import { LoadingState } from "./LoadingState";
import { fetchTrendingSections, type TrendingBook } from "../services/trending";

function TrendingBookCard({ book }: { book: TrendingBook }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/book/${book.bookId}`)}
      className="mr-3 w-28 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${book.metric} ${book.metricLabel}`}
    >
      <BookCover url={book.coverUrl} title={book.title} sizeClassName="w-28 h-40" />
      <Text className="mt-2 text-xs font-semibold text-ink" numberOfLines={2}>
        {book.title}
      </Text>
      {book.author ? (
        <Text className="mt-0.5 text-[11px] text-ink-muted" numberOfLines={1}>
          {book.author}
        </Text>
      ) : null}
      <Text className="mt-1 text-[11px] font-medium text-primary-dark">
        {book.metric} {book.metricLabel}
      </Text>
    </Pressable>
  );
}

export function TrendingBooksSection() {
  const { data: sections, isLoading, isError } = useQuery({
    queryKey: ["trending-sections"],
    queryFn: fetchTrendingSections,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View className="mb-4">
        <LoadingState message="Loading trending books…" />
      </View>
    );
  }

  if (isError || !sections?.length) {
    return null;
  }

  return (
    <View className="mb-6 gap-5">
      <View>
        <Text className="text-lg font-bold text-puce-red">Trending</Text>
        <Text className="mt-0.5 text-sm text-ink-muted">
          What readers are shelving and reviewing this week.
        </Text>
      </View>

      {sections.map((section) => (
        <View key={section.id}>
          <Text className="mb-2 text-sm font-semibold text-puce-red">{section.title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {section.books.map((book) => (
              <TrendingBookCard key={`${section.id}-${book.bookId}`} book={book} />
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}
