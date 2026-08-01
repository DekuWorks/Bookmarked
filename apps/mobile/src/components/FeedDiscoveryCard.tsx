import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BookCover } from "./BookCover";
import { StarRating } from "./StarRating";
import { fetchTrendingSections, type TrendingBook } from "../services/trending";
import type { FeedDiscoverySectionId } from "../../../../packages/utils";
import {
  DISCOVERY_CARD_ROW_PX,
  discoveryReviewState,
  discoveryReviewSummaryLabel,
  formatRatingCount,
} from "../../../../packages/utils";
import { SANS_FONT, SANS_FONT_BOLD, SANS_FONT_MEDIUM } from "../constants/theme";
import { useThemeColors } from "../store/themeStore";

const TITLES: Record<FeedDiscoverySectionId, string> = {
  trending: "Trending Books",
  shelved: "Most Shelved",
  reviewed: "Most Reviewed",
};

type Props = {
  sectionId: FeedDiscoverySectionId;
};

const CARD_WIDTH = 112;

function Card({ book }: { book: TrendingBook }) {
  const router = useRouter();
  const colors = useThemeColors();
  const hasRating = Boolean(book.communityRating);
  const reviewState = discoveryReviewState({
    hasRating,
    hasWrittenReview: false,
  });
  const summary = discoveryReviewSummaryLabel(reviewState);

  return (
    <Pressable
      onPress={() => router.push(`/book/${book.bookId}`)}
      style={{ width: CARD_WIDTH, marginRight: 12 }}
      className="active:opacity-80"
    >
      <View>
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
      </View>
    </Pressable>
  );
}

export function FeedDiscoveryCard({ sectionId }: Props) {
  const colors = useThemeColors();
  const { data: sections } = useQuery({
    queryKey: ["trending-sections"],
    queryFn: fetchTrendingSections,
    staleTime: 5 * 60 * 1000,
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
          <Card key={book.bookId} book={book} />
        ))}
      </ScrollView>
    </View>
  );
}
