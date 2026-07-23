import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BookCover } from "./BookCover";
import { Button } from "./Button";
import { FeedCard } from "./FeedCard";
import { LoadingState } from "./LoadingState";
import { ReaderSearchCard } from "./ReaderSearchCard";
import type { FeedSearchResults } from "../services/feedSearch";
import { TAB_BAR_SPACE } from "../navigation/TabBarScroll";

type Props = {
  query: string;
  results: FeedSearchResults | null;
  loading: boolean;
  error: string | null;
};

export function FeedSearchResults({ query, results, loading, error }: Props) {
  const router = useRouter();

  if (loading) {
    return <LoadingState message="Searching…" />;
  }

  if (error) {
    return (
      <View className="rounded-xl border border-rust/30 bg-surface px-4 py-3">
        <Text className="text-sm text-rust">{error}</Text>
      </View>
    );
  }

  if (!results) return null;

  const total = results.readers.length + results.books.length + results.posts.length;

  if (total === 0) {
    return (
      <View className="rounded-2xl border border-dashed border-brand-border bg-surface px-6 py-10">
        <Text className="text-center font-semibold text-puce-red">
          No results for &ldquo;{query}&rdquo;
        </Text>
        <Text className="mt-2 text-center text-sm text-ink-muted">
          Try a reader username, book title, or author name.
        </Text>
        <View className="mt-4 items-center">
          <Button title="Search books" variant="ghost" onPress={() => router.push("/search")} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE, gap: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {results.readers.length > 0 ? (
        <View>
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Readers
          </Text>
          <View className="gap-3">
            {results.readers.map((reader) => (
              <ReaderSearchCard key={reader.id} reader={reader} />
            ))}
          </View>
        </View>
      ) : null}

      {results.books.length > 0 ? (
        <View>
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Books
            </Text>
            <Pressable onPress={() => router.push("/search")} className="active:opacity-70">
              <Text className="text-xs font-medium text-primary-dark">Search books</Text>
            </Pressable>
          </View>
          <View className="gap-2">
            {results.books.map((book) => (
              <Pressable
                key={book.id}
                onPress={() => router.push(`/book/${book.id}`)}
                className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-3 active:opacity-80"
              >
                <BookCover
                  url={book.cover_url}
                  title={book.title}
                  sizeClassName="h-16 w-11"
                  saved={Boolean(book.onShelf)}
                />
                <View className="min-w-0 flex-1">
                  <Text className="font-semibold text-ink" numberOfLines={2}>
                    {book.title}
                  </Text>
                  {book.author ? (
                    <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
                      {book.author}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {results.posts.length > 0 ? (
        <View>
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Posts
          </Text>
          <View>
            {results.posts.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
