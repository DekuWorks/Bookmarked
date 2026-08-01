import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BookCover } from "./BookCover";
import { StarRating } from "./StarRating";
import { fetchTrendingSections, type TrendingBook } from "../services/trending";
import type { FeedDiscoverySectionId } from "../../../../packages/utils";
import { formatRatingCount } from "../../../../packages/utils";
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

function Card({ book }: { book: TrendingBook }) {
  const router = useRouter();
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push(`/book/${book.bookId}`)}
      className="mr-3 w-28 active:opacity-80"
    >
      <BookCover url={book.coverUrl} title={book.title} sizeClassName="w-28 h-40" />
      <Text className="mt-2 text-xs" style={{ fontFamily: SANS_FONT_BOLD, color: colors.ink }} numberOfLines={2}>
        {book.title}
      </Text>
      {book.communityRating ? (
        <View className="mt-1 flex-row items-center gap-1">
          <StarRating value={book.communityRating.averageRating} showNumber size={12} />
          <Text className="text-[10px]" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
            ({formatRatingCount(book.communityRating.ratingCount)})
          </Text>
        </View>
      ) : null}
      <Text className="mt-1 text-[11px]" style={{ fontFamily: SANS_FONT_MEDIUM, color: colors.inkMuted }}>
        {book.metric} {book.metricLabel}
      </Text>
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
