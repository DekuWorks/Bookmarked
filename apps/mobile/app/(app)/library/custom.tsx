import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../src/components/Button";
import { BookSpine } from "../../../src/components/library/BookSpine";
import { LibraryViewToggle } from "../../../src/components/library/LibraryViewToggle";
import { CoverTile } from "../../../src/components/CoverTile";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { useLibraryViewMode } from "../../../src/hooks/useLibraryViewMode";
import { clearCustomShelf, getCustomShelfBySlug } from "../../../src/services/customShelves";
import { useAuthStore } from "../../../src/store/authStore";

export default function CustomShelfScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug?: string }>();
  const slug = decodeURIComponent(String(slugParam ?? ""));
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { view, setView, isPending } = useLibraryViewMode();

  const shelfQuery = useQuery({
    queryKey: ["custom-shelf", userId, slug],
    queryFn: () => getCustomShelfBySlug(userId as string, slug),
    enabled: Boolean(userId && slug),
  });

  if (!slug) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Custom shelf" />
        <EmptyState title="Shelf not found" description="Missing shelf slug." />
      </View>
    );
  }

  if (shelfQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Custom shelf" />
        <LoadingState message="Loading shelf…" />
      </View>
    );
  }

  const shelf = shelfQuery.data;
  if (!shelf) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Custom shelf" />
        <EmptyState title="Shelf not found" description="That custom shelf doesn't exist." />
      </View>
    );
  }

  function confirmClearShelf() {
    const currentShelf = shelfQuery.data;
    if (!currentShelf) return;
    const shelfId = currentShelf.id;
    const shelfName = currentShelf.name;
    Alert.alert(
      `Clear ${shelfName}?`,
      "This removes every book from this shelf only. Your books and other shelf associations stay intact.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear shelf",
          style: "destructive",
          onPress: async () => {
            const result = await clearCustomShelf(shelfId);
            if (result.error) {
              Alert.alert("Couldn't clear shelf", result.error);
              return;
            }
            await shelfQuery.refetch();
            Alert.alert("Shelf cleared", `Books were removed from ${shelfName} only.`);
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={shelf.name} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        <Pressable onPress={() => router.push("/library")} className="active:opacity-70">
          <Text className="text-sm text-primary-dark">← Back to library</Text>
        </Pressable>

        <View>
          <Text className="text-2xl font-bold text-puce-red">📁 {shelf.name}</Text>
          {shelf.genre ? (
            <Text className="mt-1 text-sm text-ink-muted">{shelf.genre}</Text>
          ) : null}
          <Text className="mt-2 text-sm font-medium text-ink">
            {shelf.items.length} book{shelf.items.length === 1 ? "" : "s"}
          </Text>
          {shelf.items.length > 0 ? (
            <Button
              title="Clear shelf"
              variant="ghost"
              onPress={confirmClearShelf}
              className="mt-3 self-start"
            />
          ) : null}
        </View>

        <LibraryViewToggle view={view} onChange={setView} disabled={isPending} />

        {shelf.items.length === 0 ? (
          <Text className="rounded-2xl border border-dashed border-brand-border bg-background px-4 py-10 text-center text-sm text-ink-muted">
            No books on this shelf yet.
          </Text>
        ) : view === "bookshelf" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-end gap-3 rounded-2xl border border-brand-border bg-surface p-4">
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
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {shelf.items.map((item) => (
              <CoverTile
                key={item.id}
                bookId={item.books?.id}
                title={item.books?.title}
                author={item.books?.author}
                coverUrl={item.books?.cover_url}
                widthClassName="w-[23%]"
                coverSizeClassName="w-full aspect-[2/3]"
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
