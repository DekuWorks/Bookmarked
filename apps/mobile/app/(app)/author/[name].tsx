import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BookCover } from "../../../src/components/BookCover";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { SavedPill } from "../../../src/components/SavedPill";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { getBooksByAuthor } from "../../../src/services/authorBooks";
import { useAuthStore } from "../../../src/store/authStore";

export default function AuthorScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const authorName = decodeURIComponent(String(name ?? ""));
  const userId = useAuthStore((s) => s.user?.id);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["author-books", authorName, userId],
    queryFn: () => getBooksByAuthor(authorName, userId as string),
    enabled: Boolean(authorName) && Boolean(userId),
  });

  const data = query.data;
  const isEmpty = data && data.libraryBooks.length === 0 && data.catalogBooks.length === 0;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={authorName || "Author"} fallbackHref="/(app)/search" />
      {query.isLoading ? (
        <LoadingState message="Loading books…" />
      ) : isEmpty ? (
        <EmptyState title="No books found" description="We couldn't find books by this author yet." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
          {data && data.libraryBooks.length ? (
            <View>
              <Text className="mb-2 text-base font-bold text-puce-red">On your shelves</Text>
              <View className="gap-2">
                {data.libraryBooks.map((book) => (
                  <Pressable
                    key={book.id}
                    onPress={() => router.push(`/book/${book.id}`)}
                    className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-3 active:opacity-80"
                  >
                    <BookCover
                      url={book.cover_url}
                      title={book.title}
                      sizeClassName="w-12 h-16"
                      saved
                      badgeSize="small"
                    />
                    <View className="flex-1">
                      <Text className="font-semibold text-ink" numberOfLines={2}>
                        {book.title}
                      </Text>
                      <View className="mt-1 flex-row">
                        <SavedPill shelf={book.shelf_status} />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {data && data.catalogBooks.length ? (
            <View>
              <Text className="mb-2 text-base font-bold text-puce-red">More by this author</Text>
              <View className="gap-2">
                {data.catalogBooks.map((book) => (
                  <Pressable
                    key={book.id}
                    onPress={() => router.push(`/book/${book.id}`)}
                    className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-3 active:opacity-80"
                  >
                    <BookCover url={book.cover_url} title={book.title} sizeClassName="w-12 h-16" />
                    <View className="flex-1">
                      <Text className="font-semibold text-ink" numberOfLines={2}>
                        {book.title}
                      </Text>
                      {book.author ? (
                        <Text className="text-xs text-ink-muted" numberOfLines={1}>
                          {book.author}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
