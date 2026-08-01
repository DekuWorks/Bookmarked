import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BookCover } from "./BookCover";
import { LoadingState } from "./LoadingState";
import { SectionCard } from "./SectionCard";
import { StarRating } from "./StarRating";
import {
  listPublicUserReviews,
  type UserReviewWithBook,
} from "../services/readingRoom";
import {
  hasStarRating,
  hasWrittenReview,
} from "../../../../packages/utils/readingRoomReviews";

type Props = {
  userId: string;
  readerName: string;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "rated", label: "Rated" },
  { id: "written", label: "Written" },
] as const;
type PublicReviewFilter = (typeof FILTERS)[number]["id"];

export function PublicReviewsSection({ userId, readerName }: Props) {
  const [reviews, setReviews] = useState<UserReviewWithBook[] | null>(null);
  const [filter, setFilter] = useState<PublicReviewFilter>("all");

  useEffect(() => {
    setReviews(null);
    void listPublicUserReviews(userId).then(setReviews);
  }, [userId]);

  const filtered = useMemo(
    () => reviews?.filter((review) =>
      filter === "all" || (filter === "rated" ? hasStarRating(review) : hasWrittenReview(review))
    ) ?? [],
    [reviews, filter]
  );

  return (
    <SectionCard title="Public reviews" emoji="📝">
      <Text className="text-sm text-ink-muted">Ratings and reviews {readerName} has chosen to share.</Text>
      {reviews === null ? (
        <View className="mt-4"><LoadingState message="Loading public reviews…" /></View>
      ) : reviews.length === 0 ? (
        <Text className="mt-4 text-sm text-ink-muted">No public reviews yet.</Text>
      ) : (
        <>
          <View className="mt-4 flex-row flex-wrap gap-2" accessibilityRole="radiogroup" accessibilityLabel="Filter public reviews">
            {FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <Pressable key={option.id} onPress={() => setFilter(option.id)} accessibilityRole="radio" accessibilityState={{ selected: active }} className={`rounded-full border px-3 py-1.5 ${active ? "border-puce-red bg-puce-red" : "border-brand-border bg-background"}`}>
                  <Text className={`text-xs font-semibold ${active ? "text-white" : "text-ink-muted"}`}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {filtered.length === 0 ? (
            <Text className="mt-4 text-sm text-ink-muted">No public reviews match this filter.</Text>
          ) : (
            <View className="mt-4 gap-3">
              {filtered.map((review) => <PublicReviewCard key={review.id} review={review} />)}
            </View>
          )}
        </>
      )}
    </SectionCard>
  );
}

function PublicReviewCard({ review }: { review: UserReviewWithBook }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(!review.has_spoilers);
  const written = hasWrittenReview(review);
  const rated = hasStarRating(review);
  const book = review.books;

  return (
    <View className="flex-row gap-3 rounded-xl border border-brand-border bg-background/70 p-3">
      {book ? (
        <Pressable onPress={() => router.push(`/book/${book.id}`)} className="w-[56px]">
          <BookCover url={book.cover_url} title={book.title} sizeClassName="h-[84px] w-[56px]" />
        </Pressable>
      ) : null}
      <View className="min-w-0 flex-1">
        <Pressable onPress={() => book?.id && router.push(`/book/${book.id}`)}>
          <Text className="font-semibold text-primary-dark">{book?.title ?? "Review"}</Text>
        </Pressable>
        {book?.author ? <Text className="text-xs text-ink-muted">{book.author}</Text> : null}
        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          {rated ? <StarRating value={review.rating!} showNumber /> : written ? <Text className="text-xs text-ink-muted">Written review</Text> : null}
          {review.has_spoilers ? <Text className="rounded-full bg-rust/15 px-2 py-0.5 text-xs font-medium text-rust">Spoilers</Text> : null}
        </View>
        {written ? (
          <View className="mt-2">
            <Text className={`text-sm leading-relaxed text-ink-muted ${revealed ? "" : "opacity-15"}`}>{review.review_body}</Text>
            {review.has_spoilers ? (
              <Pressable onPress={() => setRevealed((value) => !value)} className="mt-2 self-start">
                <Text className="text-xs font-medium text-primary-dark">{revealed ? "Hide spoilers" : "Reveal spoilers"}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
