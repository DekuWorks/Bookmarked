import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { CoverTile } from "../../../src/components/CoverTile";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { useLibrary } from "../../../src/hooks/useLibrary";
import { FAVORITES_LISTING } from "../../../../../packages/utils/overviewCopy";
import { originBackLink } from "../../../../../packages/utils/navigationOrigin";

export default function LibraryFavoritesScreen() {
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const back = originBackLink(origin, "mobile", {
    href: "/library",
    label: "← Back to Library",
  });
  const { data: shelves, isLoading, isError } = useLibrary();

  const favorites = useMemo(
    () => (shelves ?? []).flatMap((shelf) => shelf.items).filter((book) => book.is_favorite),
    [shelves]
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={FAVORITES_LISTING.title} backHref={back.href} fallbackHref={back.href} />
      {isLoading ? (
        <LoadingState message="Loading favorites…" />
      ) : isError ? (
        <EmptyState title="Couldn't load favorites" description="Please try again." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
          <Text className="text-sm text-ink-muted">{FAVORITES_LISTING.description}</Text>
          <Text className="text-sm font-medium text-ink">
            {favorites.length} {favorites.length === 1 ? "book" : "books"}
          </Text>
          {favorites.length === 0 ? (
            <Text className="rounded-2xl border border-dashed border-brand-border bg-background px-4 py-10 text-center text-sm text-ink-muted">
              {FAVORITES_LISTING.empty}
            </Text>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {favorites.map((item) => (
                <CoverTile
                  key={item.id}
                  bookId={item.books?.id}
                  title={item.books?.title}
                  author={item.books?.author}
                  coverUrl={item.books?.cover_url}
                  widthClassName="w-[30%]"
                  coverSizeClassName="w-full aspect-[2/3]"
                  saved
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
