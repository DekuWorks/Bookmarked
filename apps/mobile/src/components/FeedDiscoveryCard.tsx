import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BookCover } from "./BookCover";
import { StarRating } from "./StarRating";
import { fetchTrendingSections, type TrendingBook } from "../services/trending";
import type { FeedDiscoverySectionId } from "../../../../packages/utils";
import {
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
      <View style={{ height: 340 }}>
        <BookCover url={book.coverUrl} title={book.title} sizeClassName="w-28 h-40" />
        <Text
          className="mt-2 text-xs"
          style={{ fontFamily: SANS_FONT_BOLD, color: colors.ink, minHeight: 32 }}
          numberOfLines={2}
        >
          {book.title}
        </Text>
        <Text
          className="mt-0.5 text-[11px]"
          style={{ fontFamily: SANS_FONT, color: colors.inkMuted, minHeight: 14 }}
          numberOfLines={1}
        >
          {book.author?.trim() || " "}
        </Text>
        <View style={{ minHeight: 36, marginTop: 4, justifyContent: "center" }}>
          {book.communityRating ? (
            <View className="flex-row items-center gap-1">
              <StarRating value={book.communityRating.averageRating} showNumber size={12} />
              <Text className="text-[10px]" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
                ({formatRatingCount(book.communityRating.ratingCount)})
              </Text>
            </View>
          ) : (
            <Text className="text-[10px]" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
              {summary}
            </Text>
          )}
        </View>
        <View style={{ minHeight: 28, marginTop: 4 }} />
        <View style={{ minHeight: 20, marginTop: 4 }} />
        <Text
          className="mt-1 text-[11px]"
          style={{ fontFamily: SANS_FONT_MEDIUM, color: colors.inkMuted, marginTop: "auto" }}
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
