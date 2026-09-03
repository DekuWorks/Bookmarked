import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookshelfSection } from "../../../src/components/library/BookshelfSection";
import { CustomShelfSection } from "../../../src/components/library/CustomShelfSection";
import { LibraryGridView } from "../../../src/components/library/LibraryGridView";
import { LibraryViewToggle } from "../../../src/components/library/LibraryViewToggle";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenGradientWash } from "../../../src/components/ScreenGradientWash";
import { useLibrary } from "../../../src/hooks/useLibrary";
import { useLibraryViewMode } from "../../../src/hooks/useLibraryViewMode";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../../src/navigation/TabBarScroll";
import { getCustomShelfGroupsWithBooks } from "../../../src/services/customShelves";
import { useAuthStore } from "../../../src/store/authStore";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { onScroll } = useTabBarScroll();
  const { data: shelves, isLoading, isError, error } = useLibrary();
  const { view, setView, isPending } = useLibraryViewMode();

  const customShelvesQuery = useQuery({
    queryKey: ["custom-shelves", userId],
    queryFn: () => getCustomShelfGroupsWithBooks(userId as string),
    enabled: Boolean(userId),
  });

  const customShelves = customShelvesQuery.data ?? [];
  const totalBooks = (shelves ?? []).reduce((sum, shelf) => sum + shelf.items.length, 0);
  const isEmpty = totalBooks === 0 && customShelves.every((s) => s.items.length === 0);

  return (
    <View className="flex-1 bg-background">
      <ScreenGradientWash />
      <View style={{ paddingTop: insets.top + 8 }} className="bg-background px-4 pb-2">
        <View className="flex-row items-center">
          <Text className="flex-1 text-3xl font-black text-puce-red">Library</Text>
          <Pressable
            onPress={() => router.push("/search")}
            accessibilityLabel="Add a book"
            className="h-10 w-10 items-center justify-center rounded-full bg-puce-red active:opacity-80"
          >
            <Text className="text-2xl font-light leading-6 text-white">+</Text>
          </Pressable>
        </View>
        <Text className="mt-1 text-sm text-ink-muted">
          Browse your shelves — switch between bookshelf and grid views.
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
          <Pressable onPress={() => router.push("/library/my-books")} className="self-start active:opacity-70">
            <Text className="text-sm font-medium text-primary-dark">All Books List ›</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/shelf-privacy")} className="self-start active:opacity-70">
            <Text className="text-sm font-medium text-primary-dark">Create custom shelf ›</Text>
          </Pressable>
        </View>
      </View>

      {isLoading || customShelvesQuery.isLoading ? (
        <LoadingState message="Loading your library…" />
      ) : isError ? (
        <EmptyState
          title="Couldn't load your library"
          description={error instanceof Error ? error.message : "Please try again."}
        />
      ) : (
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 16 }}
        >
          <LibraryViewToggle view={view} onChange={setView} disabled={isPending} />

          {isEmpty ? (
            <EmptyState
              title="Your library is empty"
              description="Add books from Search to start building your shelves."
            />
          ) : view === "bookshelf" ? (
            <>
              {(shelves ?? []).map((shelf) => (
                <BookshelfSection
                  key={shelf.slug}
                  title={shelf.title}
                  status={shelf.status}
                  slug={shelf.slug}
                  items={shelf.items}
                />
              ))}
              {customShelves.map((shelf) => (
                <CustomShelfSection key={shelf.id} shelf={shelf} view="bookshelf" />
              ))}
            </>
          ) : (
            <>
              <LibraryGridView shelves={shelves ?? []} />
              {customShelves.map((shelf) => (
                <CustomShelfSection key={shelf.id} shelf={shelf} view="grid" />
              ))}
            </>
          )}
        </Animated.ScrollView>
      )}
    </View>
  );
}
