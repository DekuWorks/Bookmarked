import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BookCover } from "../BookCover";
import { SectionCard } from "../SectionCard";
import { StarRating } from "../StarRating";
import type { LibraryBookRow } from "../../services/library";
import {
  OVERVIEW_SHELF_COVER,
  overviewShelfCoverBoxStyle,
} from "../../../../../packages/utils/overviewShelfCover";

type Props = {
  title: string;
  shelfIconId?: "read" | "currently_reading" | "want_to_read";
  emoji?: string;
  items: LibraryBookRow[];
  emptyMessage: string;
  viewAllLabel: string;
  onViewAll: () => void;
  showFinishedDate?: boolean;
  showFavoriteBadge?: boolean;
};

function formatFinishedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function OverviewBookShelf({
  title,
  shelfIconId,
  emoji,
  items,
  emptyMessage,
  viewAllLabel,
  onViewAll,
  showFinishedDate = false,
  showFavoriteBadge = false,
}: Props) {
  const router = useRouter();

  return (
    <SectionCard
      title={title}
      shelfIconId={shelfIconId}
      emoji={emoji}
      action={
        <Pressable onPress={onViewAll} accessibilityRole="button">
          <Text className="text-sm font-semibold text-primary-dark">{viewAllLabel}</Text>
        </Pressable>
      }
    >
      {items.length === 0 ? (
        <Text className="text-sm text-ink-muted">{emptyMessage}</Text>
      ) : (
        <View className="gap-3">
          {items.map((item) => {
            const book = item.books;
            const finishedLabel = showFinishedDate ? formatFinishedDate(item.finished_at) : null;

            return (
              <Pressable
                key={item.id}
                disabled={!book?.id}
                onPress={() => book?.id && router.push(`/book/${book.id}`)}
                className="flex-row items-start gap-3 rounded-xl border border-brand-border bg-background/70 p-3 active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel={book?.title ?? "Book"}
              >
                <View className="shrink-0">
                  <BookCover
                    url={book?.cover_url}
                    title={book?.title}
                    sizeStyle={overviewShelfCoverBoxStyle()}
                    resizeMode={OVERVIEW_SHELF_COVER.fit}
                    saved
                  />
                </View>
                <View className="min-w-0 flex-1 overflow-hidden">
                  <Text className="text-sm font-semibold text-ink" numberOfLines={2}>
                    {book?.title ?? "Untitled"}
                  </Text>
                  {book?.author ? (
                    <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
                      {book.author}
                    </Text>
                  ) : null}
                  {showFavoriteBadge && item.is_favorite ? (
                    <View className="mt-2 self-start rounded-full bg-primary/15 px-2.5 py-0.5">
                      <Text
                        className="text-[10px] font-semibold uppercase tracking-wide text-puce-red"
                        accessibilityLabel="Favorite"
                      >
                        ★ Favorite
                      </Text>
                    </View>
                  ) : null}
                  {item.rating != null && item.rating > 0 ? (
                    <View className="mt-2">
                      <StarRating value={item.rating} showNumber size={12} />
                    </View>
                  ) : null}
                  {finishedLabel ? (
                    <Text className="mt-2 text-xs text-ink-muted">Finished {finishedLabel}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </SectionCard>
  );
}

export function useDeferredOverviewSections(active: boolean) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }

    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, [active]);

  return ready;
}
