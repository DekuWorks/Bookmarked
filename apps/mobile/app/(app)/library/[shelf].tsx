import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BookSpine } from "../../../src/components/library/BookSpine";
import { LibraryViewToggle } from "../../../src/components/library/LibraryViewToggle";
import { CoverTile } from "../../../src/components/CoverTile";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { getShelfConfigBySlug } from "../../../src/constants/shelves";
import { ShelfIcon } from "../../../src/components/ShelfIcon";
import { ShelfTitleRow } from "../../../src/components/ShelfTitleRow";
import { useLibrary } from "../../../src/hooks/useLibrary";
import { useLibraryViewMode } from "../../../src/hooks/useLibraryViewMode";

export default function LibraryShelfScreen() {
  const { shelf: shelfSlugParam } = useLocalSearchParams<{ shelf: string }>();
  const shelfSlug = decodeURIComponent(String(shelfSlugParam ?? ""));
  const config = getShelfConfigBySlug(shelfSlug);
  const router = useRouter();
  const { data: shelves, isLoading, isError } = useLibrary();
  const { view, setView, isPending } = useLibraryViewMode();

  const shelf = useMemo(
    () => (config ? (shelves ?? []).find((entry) => entry.status === config.status) : null),
    [config, shelves]
  );

  if (!config) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Shelf" />
        <EmptyState title="Shelf not found" description="That shelf doesn't exist." />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={config.title} />
        <LoadingState message="Loading shelf…" />
      </View>
    );
  }

  if (isError || !shelf) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={config.title} />
        <EmptyState title="Shelf not found" description="No books on this shelf yet." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={config.title} left={<ShelfIcon id={config.status} size="small" labeled />} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        <Pressable onPress={() => router.push("/library")} className="active:opacity-70">
          <Text className="text-sm text-primary-dark">← Back to library</Text>
        </Pressable>

        <View>
          <ShelfTitleRow id={config.status} title={config.title} titleClassName="text-2xl font-bold text-puce-red" />
          <Text className="mt-1 text-sm text-ink-muted">{config.description}</Text>
          <Text className="mt-2 text-sm font-medium text-ink">
            {shelf.items.length} book{shelf.items.length === 1 ? "" : "s"}
          </Text>
        </View>

        <LibraryViewToggle view={view} onChange={setView} disabled={isPending} />

        {shelf.items.length === 0 ? (
          <Text className="rounded-2xl border border-dashed border-brand-border bg-background px-4 py-10 text-center text-sm text-ink-muted">
            No books on this shelf yet.
          </Text>
        ) : view === "bookshelf" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-end gap-2 rounded-2xl border border-brand-border bg-surface p-4">
              {shelf.items.map((item) => (
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
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {shelf.items.map((item) => (
              <CoverTile
                key={item.id}
                bookId={item.books?.id}
                title={item.books?.title}
                author={item.books?.author}
                coverUrl={item.books?.cover_url}
                widthClassName="w-[30%]"
                coverSizeClassName="w-full aspect-[2/3]"
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
