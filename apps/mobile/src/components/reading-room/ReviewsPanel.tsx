import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { BookCover } from "../BookCover";
import { FeelingChip } from "../FeelingChip";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import { StarRating } from "../StarRating";
import type { UserReviewWithBook } from "../../services/readingRoom";
import {
  filterReviews,
  groupReviewsByMonth,
  hasStarRating,
  hasWrittenReview,
  REVIEW_FILTER_OPTIONS,
  REVIEW_PANEL_COPY,
  type ReviewFilter,
} from "../../../../../packages/utils/readingRoomReviews";
import { ShareReviewButton } from "./ShareReviewButton";
import { PrivateReviewBadge } from "../PrivateReviewBadge";
import { ReviewVisibilityControl } from "../ReviewVisibilityControl";
import { updateReviewVisibility } from "../../services/reviews";
import {
  PRIVATE_REVIEWS_EMPTY_COPY,
  isPrivateReview,
  parseReviewAudience,
  type ReviewAudience,
} from "../../../../../packages/utils/reviewVisibility";

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  reviews: UserReviewWithBook[] | null;
  onReviewsChange?: () => void;
};

export function ReviewsPanel({ reviews, onReviewsChange }: Props) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const filtered = useMemo(
    () => (reviews ? filterReviews(reviews, filter) : []),
    [reviews, filter]
  );

  return (
    <SectionCard title={REVIEW_PANEL_COPY.title}>
      <Text className="text-sm text-ink-muted">{REVIEW_PANEL_COPY.subtitle}</Text>

      {reviews === null ? (
        <View className="mt-4">
          <LoadingState message="Loading reviews…" />
        </View>
      ) : reviews.length === 0 ? (
        <Text className="mt-4 text-sm text-ink-muted">
          Finish a book and share your thoughts from its detail page.
        </Text>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            style={{ flexGrow: 0, flexShrink: 0, height: 40 }}
            contentContainerStyle={{ alignItems: "center", gap: 8, height: 40, paddingRight: 8 }}
            accessibilityRole="radiogroup"
            accessibilityLabel="Filter reviews"
          >
            {REVIEW_FILTER_OPTIONS.map((option) => {
              const active = filter === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setFilter(option.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: active, checked: active }}
                  className={`h-8 shrink-0 items-center justify-center rounded-full border px-3 ${
                    active ? "border-puce-red bg-puce-red" : "border-brand-border bg-background"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${active ? "text-white" : "text-ink-muted"}`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filtered.length === 0 ? (
            filter === "private" ? (
              <View className="mt-4 gap-1">
                <Text className="text-sm text-ink-muted">{PRIVATE_REVIEWS_EMPTY_COPY.title}</Text>
                <Text className="text-sm text-ink-muted">{PRIVATE_REVIEWS_EMPTY_COPY.hint}</Text>
              </View>
            ) : (
              <Text className="mt-4 text-sm text-ink-muted">{REVIEW_PANEL_COPY.filterEmpty}</Text>
            )
          ) : (
            <View className="mt-4 gap-6">
              {groupReviewsByMonth(filtered).map(([month, monthReviews]) => (
                <View key={month}>
                  <Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {month}
                  </Text>
                  <View className="mt-3 gap-3">
                    {monthReviews.map((review) => (
                      <ReviewHistoryCard
                        key={review.id}
                        review={review}
                        onReviewsChange={onReviewsChange}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </SectionCard>
  );
}

function ReviewHistoryCard({
  review,
  onReviewsChange,
}: {
  review: UserReviewWithBook;
  onReviewsChange?: () => void;
}) {
  const router = useRouter();
  const written = hasWrittenReview(review);
  const rated = hasStarRating(review);
  const [visibility, setVisibility] = useState<ReviewAudience>(
    parseReviewAudience(review.visibility)
  );
  const [saving, setSaving] = useState(false);
  const [prevReviewVisibility, setPrevReviewVisibility] = useState(review.visibility);
  if (review.visibility !== prevReviewVisibility) {
    setPrevReviewVisibility(review.visibility);
    setVisibility(parseReviewAudience(review.visibility));
  }

  async function persistVisibility(next: ReviewAudience) {
    if (next === visibility) return;
    setVisibility(next);
    setSaving(true);
    const result = await updateReviewVisibility(review.id, next);
    setSaving(false);
    if (result.error) {
      setVisibility(parseReviewAudience(review.visibility));
      Alert.alert("Couldn't update visibility", result.error);
      return;
    }
    onReviewsChange?.();
  }

  return (
    <View className="rounded-xl border border-brand-border bg-background/70 p-3">
      <View className="flex-col gap-3 sm:flex-row">
        {review.books ? (
          <Pressable
            onPress={() => review.books?.id && router.push(`/book/${review.books.id}`)}
            className="self-center sm:self-start"
          >
            <BookCover
              url={review.books.cover_url}
              title={review.books.title}
              sizeClassName="w-[80px] h-[120px]"
            />
          </Pressable>
        ) : null}

        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Pressable
              onPress={() => review.books?.id && router.push(`/book/${review.books.id}`)}
              className="min-w-0 flex-1 active:opacity-80"
            >
              <Text className="font-semibold text-primary-dark">
                {review.books?.title ?? "Review"}
              </Text>
            </Pressable>
            {review.read_number > 1 ? (
              <Text className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-puce-red">
                Read #{review.read_number}
              </Text>
            ) : null}
          </View>

          {review.books?.author ? (
            <Text className="text-xs text-ink-muted">{review.books.author}</Text>
          ) : null}

          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            {rated ? (
              <StarRating value={review.rating!} showNumber />
            ) : written ? (
              <Text className="text-xs text-ink-muted">No star rating</Text>
            ) : null}
            {review.edition ? (
              <Text className="text-xs text-ink-muted">· {review.edition}</Text>
            ) : null}
            {review.has_spoilers ? (
              <Text className="rounded-full bg-rust/15 px-2 py-0.5 text-xs font-medium text-rust">
                Spoilers
              </Text>
            ) : null}
            {isPrivateReview(visibility) ? <PrivateReviewBadge compact /> : null}
            <Text className="text-xs text-ink-muted">{formatReviewDate(review.created_at)}</Text>
          </View>

          {review.feelings?.length ? (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {review.feelings.map((feeling, i) => (
                <FeelingChip key={feeling} label={feeling} index={i} />
              ))}
            </View>
          ) : null}

          {written ? (
            <Text className="mt-2 text-sm leading-relaxed text-ink-muted">
              {review.review_body}
            </Text>
          ) : rated ? (
            <Text className="mt-2 text-sm italic text-ink-muted">
              Rating only — no written review.
            </Text>
          ) : null}

          <View className="mt-3">
            <ReviewVisibilityControl
              value={visibility}
              disabled={saving}
              onChange={(next) => void persistVisibility(next)}
            />
          </View>

          {review.books?.id && !isPrivateReview(visibility) ? (
            <View className="mt-3 flex-row justify-end">
              <ShareReviewButton review={review} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
