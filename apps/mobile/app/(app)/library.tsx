import { FlatList, RefreshControl, ScrollView, Text, View } from "react-native";
import { BookCover } from "../../src/components/BookCover";
import { EmptyState } from "../../src/components/EmptyState";
import { LoadingState } from "../../src/components/LoadingState";
import { ShelfBadge } from "../../src/components/ShelfBadge";
import { useLibrary } from "../../src/hooks/useLibrary";
import type { LibraryBookRow, ShelfGroup } from "../../src/services/library";

function ShelfRow({ shelf }: { shelf: ShelfGroup }) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3 px-5">
        <Text className="text-lg font-bold text-ink">
          {shelf.emoji} {shelf.title}
        </Text>
        <ShelfBadge label="Books" count={shelf.items.length} />
      </View>

      {shelf.items.length === 0 ? (
        <Text className="text-ink-muted px-5">No books here yet.</Text>
      ) : (
        <FlatList
          horizontal
          data={shelf.items}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={({ item }: { item: LibraryBookRow }) => (
            <View className="w-24">
              <BookCover
                url={item.books?.cover_url}
                title={item.books?.title}
                sizeClassName="w-24 h-36"
              />
              <Text className="text-xs font-medium text-ink mt-1" numberOfLines={2}>
                {item.books?.title ?? "Untitled"}
              </Text>
              {item.books?.author ? (
                <Text className="text-[11px] text-ink-muted" numberOfLines={1}>
                  {item.books.author}
                </Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

export default function LibraryRoute() {
  const { data: shelves, isLoading, isError, error, refetch, isRefetching } = useLibrary();

  if (isLoading) return <LoadingState message="Loading your library…" />;

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load your library"
        description={error instanceof Error ? error.message : "Please try again."}
      />
    );
  }

  const totalBooks = (shelves ?? []).reduce((sum, s) => sum + s.items.length, 0);

  if (totalBooks === 0) {
    return (
      <EmptyState
        title="Your shelves are empty"
        description="Add books from the web app or the Search tab to start building your library."
      />
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingVertical: 16 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#642F37" />
      }
    >
      {(shelves ?? []).map((shelf) => (
        <ShelfRow key={shelf.status} shelf={shelf} />
      ))}
    </ScrollView>
  );
}
