import { useState } from "react";
import { ActionSheetIOS, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BookCover } from "./BookCover";
import { StarRating } from "./StarRating";
import { fetchTrendingSections, type TrendingBook } from "../services/trending";
import { setShelfStatus } from "../services/library";
import {
  addBookToCustomShelf,
  listUserCustomShelves,
} from "../services/customShelves";
import { useAuthStore } from "../store/authStore";
import { getShelvesInOrder } from "../constants/shelves";
import { feedBookHref } from "../lib/feedNav";
import type { FeedDiscoverySectionId } from "../../../../packages/utils";
import {
  DISCOVERY_CARD_ROW_PX,
  discoveryReviewState,
  discoveryReviewSummaryLabel,
  formatRatingCount,
} from "../../../../packages/utils";
import { SANS_FONT, SANS_FONT_BOLD, SANS_FONT_MEDIUM } from "../constants/theme";
import { useThemeColors } from "../store/themeStore";
import type { ShelfStatus } from "../types";

const TITLES: Record<FeedDiscoverySectionId, string> = {
  trending: "Trending Books",
  shelved: "Most Shelved",
  reviewed: "Most Reviewed",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Props = {
  sectionId: FeedDiscoverySectionId;
  getScrollOffset?: () => number;
};

const CARD_WIDTH = 112;

function Card({ book, getScrollOffset }: { book: TrendingBook; getScrollOffset?: () => number }) {
  const router = useRouter();
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);
  const [saving, setSaving] = useState(false);
  const hasRating = Boolean(book.communityRating);
  const reviewState = discoveryReviewState({
    hasRating,
    hasWrittenReview: false,
  });
  const summary = discoveryReviewSummaryLabel(reviewState);

  function openBook() {
    router.push(feedBookHref(book.bookId, { scroll: getScrollOffset?.() }) as never);
  }

  function openReview() {
    router.push(
      feedBookHref(book.bookId, { scroll: getScrollOffset?.(), section: "reviews" }) as never
    );
  }

  async function applyShelf(status: ShelfStatus) {
    if (!userId) return;
    setSaving(true);
    const result = await setShelfStatus(
      userId,
      { id: book.bookId, title: book.title, cover_url: book.coverUrl },
      status
    );
    setSaving(false);
    Alert.alert(
      result.error ? "Couldn't save" : "Saved",
      result.error ?? `Added to ${status.replace(/_/g, " ")}.`
    );
  }

  async function applyCustomShelf(shelfId: string, name: string) {
    if (!userId) return;
    setSaving(true);
    const result = await addBookToCustomShelf(shelfId, userId, book.bookId);
    setSaving(false);
    Alert.alert(result.error ? "Couldn't save" : "Saved", result.error ?? `Added to ${name}.`);
  }

  async function openShelfPicker() {
    if (!userId || saving) return;
    const shelves = getShelvesInOrder();
    let custom: { id: string; name: string }[] = [];
    try {
      custom = (await listUserCustomShelves(userId)).map((shelf) => ({
        id: shelf.id,
        name: shelf.name,
      }));
    } catch {
      custom = [];
    }

    const options = [...shelves.map((shelf) => shelf.title), "Custom collections…", "Cancel"];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        title: `Add ${book.title} to a shelf`,
      },
      (index) => {
        if (index < 0 || index === options.length - 1) return;
        if (index < shelves.length) {
          const shelf = shelves[index];
          if (shelf) void applyShelf(shelf.status);
          return;
        }
        if (!custom.length) {
          Alert.alert("No collections", "Create a custom shelf from your library first.");
          return;
        }
        const customOptions = [...custom.map((shelf) => shelf.name), "Cancel"];
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: customOptions,
            cancelButtonIndex: customOptions.length - 1,
            title: "Custom collections",
          },
          (customIndex) => {
            if (customIndex < 0 || customIndex >= custom.length) return;
            const shelf = custom[customIndex];
            if (shelf) void applyCustomShelf(shelf.id, shelf.name);
          }
        );
      }
    );
  }

  return (
    <View style={{ width: CARD_WIDTH, marginRight: 12 }}>
      <Pressable onPress={openBook} className="active:opacity-80">
        <View
          style={{ height: DISCOVERY_CARD_ROW_PX.coverHeight, overflow: "hidden" }}
        >
          <BookCover url={book.coverUrl} title={book.title} sizeClassName="w-28 h-40" />
        </View>
        <Text
          className="mt-2 text-xs"
          style={{ fontFamily: SANS_FONT_BOLD, color: colors.ink, height: DISCOVERY_CARD_ROW_PX.title }}
          numberOfLines={2}
        >
          {book.title}
        </Text>
        <Text
          className="mt-0.5 text-[11px]"
          style={{ fontFamily: SANS_FONT, color: colors.inkMuted, height: DISCOVERY_CARD_ROW_PX.author }}
          numberOfLines={1}
        >
          {book.author?.trim() || " "}
        </Text>
        <View
          style={{
            height: DISCOVERY_CARD_ROW_PX.rating,
            marginTop: 4,
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {book.communityRating ? (
            <View className="flex-row items-center gap-1">
              <StarRating value={book.communityRating.averageRating} showNumber size={12} />
              <Text className="text-[10px]" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
                ({formatRatingCount(book.communityRating.ratingCount)})
              </Text>
            </View>
          ) : (
            <Text
              className="text-[10px]"
              style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}
              numberOfLines={1}
            >
              {summary}
            </Text>
          )}
        </View>
        <View style={{ height: DISCOVERY_CARD_ROW_PX.review, marginTop: 4 }} />
        <View style={{ height: DISCOVERY_CARD_ROW_PX.tags, marginTop: 4 }} />
        <Text
          className="mt-1 text-[11px]"
          style={{ fontFamily: SANS_FONT_MEDIUM, color: colors.inkMuted, height: DISCOVERY_CARD_ROW_PX.metric }}
          numberOfLines={1}
        >
          {book.metric} {book.metricLabel}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => void openShelfPicker()}
        disabled={saving}
        className="mt-2 min-h-[32px] items-center justify-center rounded-md border border-brand-border active:opacity-70"
      >
        <Text className="text-[11px] font-medium text-ink">Add to Shelf</Text>
      </Pressable>
      <Pressable
        onPress={openReview}
        className="mt-1 min-h-[32px] items-center justify-center active:opacity-70"
      >
        <Text className="text-[11px] font-medium text-primary-dark">Rate & Review</Text>
      </Pressable>
    </View>
  );
}

export function FeedDiscoveryCard({ sectionId, getScrollOffset }: Props) {
  const colors = useThemeColors();
  const { data: sections } = useQuery({
    queryKey: ["trending-sections"],
    queryFn: fetchTrendingSections,
    staleTime: WEEK_MS,
  });

  const section = sections?.find((row) => row.id === sectionId) ?? null;
  if (!section?.books.length) return null;

  return (
    <View className="mb-4 rounded-2xl border border-brand-border bg-surface p-4 shadow-md">
      <Text className="text-base" style={{ fontFamily: SANS_FONT_BOLD, color: colors.puceRed }}>
        {TITLES[sectionId] ?? section.title}
      </Text>
      <Text className="mt-1 text-sm" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
        Scroll to explore what readers are loving.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
        {section.books.map((book) => (
          <Card key={book.bookId} book={book} getScrollOffset={getScrollOffset} />
        ))}
      </ScrollView>
    </View>
  );
}
