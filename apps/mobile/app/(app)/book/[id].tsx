import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BookCover } from "../../../src/components/BookCover";
import { Button } from "../../../src/components/Button";
import { EmptyState } from "../../../src/components/EmptyState";
import { FeelingChip } from "../../../src/components/FeelingChip";
import { LoadingState } from "../../../src/components/LoadingState";
import { ProgressBar } from "../../../src/components/ProgressBar";
import { RateReviewSheet } from "../../../src/components/RateReviewSheet";
import { SavedPill } from "../../../src/components/SavedPill";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { StarRating } from "../../../src/components/StarRating";
import { getBookDetails } from "../../../src/services/bookDetails";
import {
  markFinished,
  setShelfStatus,
  updateReadingProgress,
} from "../../../src/services/library";
import { useAuthStore } from "../../../src/store/authStore";
import type { Review, ShelfStatus } from "../../../src/types";

const SHELVES: { status: ShelfStatus; label: string }[] = [
  { status: "want_to_read", label: "TBR" },
  { status: "currently_reading", label: "Reading" },
  { status: "read", label: "Read" },
];

function ReviewItem({ review }: { review: Review }) {
  const [revealed, setRevealed] = useState(false);
  const name = review.profiles?.display_name?.trim() || review.profiles?.username?.trim() || "Reader";
  const hidden = review.has_spoilers && !revealed;
  return (
    <View className="mb-3 rounded-2xl border border-brand-border bg-surface p-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-ink">{name}</Text>
        {review.read_number > 1 ? (
          <Text className="text-xs text-primary-dark">Read #{review.read_number}</Text>
        ) : null}
      </View>
      {review.rating != null ? (
        <View className="mt-1 flex-row items-center gap-2">
          <StarRating value={review.rating} showNumber />
          {review.rating_emoji ? <Text>{review.rating_emoji}</Text> : null}
        </View>
      ) : null}
      {review.review_body ? (
        hidden ? (
          <Pressable
            onPress={() => setRevealed(true)}
            className="mt-2 flex-row items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 active:opacity-80"
          >
            <Text className="text-puce-red">🔒</Text>
            <Text className="text-sm font-medium text-puce-red">Spoiler review (tap to view)</Text>
          </Pressable>
        ) : (
          <Text className="mt-2 leading-5 text-ink">{review.review_body}</Text>
        )
      ) : null}
      {review.feelings?.length ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {review.feelings.map((f, i) => (
            <FeelingChip key={f} label={f} index={i} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = String(id);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const [rateOpen, setRateOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState("");

  const details = useQuery({
    queryKey: ["book-details", bookId, userId],
    queryFn: () => getBookDetails(bookId, userId as string),
    enabled: Boolean(userId) && Boolean(bookId),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["book-details", bookId, userId] });
    queryClient.invalidateQueries({ queryKey: ["library"] });
    queryClient.invalidateQueries({ queryKey: ["home-feed"] });
  }

  const data = details.data;
  const book = data?.book;

  async function changeShelf(shelf: ShelfStatus) {
    if (!userId || !book) return;
    const result = await setShelfStatus(userId, book, shelf);
    if (result.error) Alert.alert("Error", result.error);
    invalidate();
  }

  async function finish() {
    if (!userId || !book) return;
    const result = await markFinished(userId, book);
    if (result.error) Alert.alert("Error", result.error);
    invalidate();
  }

  async function saveProgress() {
    if (!userId || !book) return;
    const percent = Math.max(0, Math.min(100, Number(progressValue) || 0));
    const result = await updateReadingProgress(userId, book, { progressPercent: percent });
    setProgressOpen(false);
    setProgressValue("");
    if (result.error) Alert.alert("Error", result.error);
    invalidate();
  }

  if (details.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Book" />
        <LoadingState message="Loading book…" />
      </View>
    );
  }

  if (!book) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Book" />
        <EmptyState title="Book not found" description="This book may have been removed." />
      </View>
    );
  }

  const userBook = data?.userBook ?? null;
  const ownReview = data?.ownReviews?.[0] ?? null;
  const otherReviews = (data?.reviews ?? []).filter((r) => r.user_id !== userId);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={book.title} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
        <View className="flex-row gap-4">
          <BookCover
            url={book.cover_url}
            title={book.title}
            sizeClassName="w-28 h-44"
            saved={Boolean(userBook)}
            ribbonSize={24}
          />
          <View className="flex-1">
            <Text className="text-xl font-bold text-ink">{book.title}</Text>
            {book.author ? <Text className="mt-0.5 text-ink-muted">{book.author}</Text> : null}
            {userBook ? (
              <View className="mt-2">
                <SavedPill shelf={userBook.shelf_status} />
              </View>
            ) : null}
            {data?.communityRating ? (
              <View className="mt-2 flex-row items-center gap-2">
                <StarRating value={data.communityRating.averageRating} showNumber />
                <Text className="text-xs text-ink-muted">({data.communityRating.ratingCount})</Text>
              </View>
            ) : null}
            {userBook?.finished_at ? (
              <Text className="mt-2 text-xs text-ink-muted">
                Finished on {new Date(userBook.finished_at).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Shelf actions */}
        <View className="flex-row gap-2">
          {SHELVES.map((s) => {
            const active = userBook?.shelf_status === s.status;
            return (
              <Pressable
                key={s.status}
                onPress={() => changeShelf(s.status)}
                className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-puce-red" : "bg-primary/15"}`}
              >
                <Text className={`text-sm font-semibold ${active ? "text-white" : "text-puce-red"}`}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {userBook?.shelf_status === "currently_reading" ? (
          <View className="rounded-2xl border border-brand-border bg-surface p-4">
            <Text className="mb-2 font-semibold text-ink">Reading progress</Text>
            <ProgressBar percent={userBook.progress_percent ?? 0} />
            <Text className="mt-1 text-xs text-ink-muted">{userBook.progress_percent ?? 0}%</Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button
                  title="Update progress"
                  variant="ghost"
                  onPress={() => {
                    setProgressValue(String(userBook.progress_percent ?? 0));
                    setProgressOpen(true);
                  }}
                />
              </View>
              <View className="flex-1">
                <Button title="Mark finished" onPress={finish} />
              </View>
            </View>
          </View>
        ) : null}

        <Button
          title={ownReview ? "Edit your review" : "Rate & review"}
          variant="secondary"
          onPress={() => setRateOpen(true)}
        />

        {ownReview ? (
          <View>
            <Text className="mb-2 text-base font-bold text-puce-red">Your review</Text>
            <ReviewItem review={ownReview} />
          </View>
        ) : null}

        {book.description ? (
          <View>
            <Text className="mb-1 text-base font-bold text-puce-red">About</Text>
            <Text className="leading-5 text-ink">{book.description}</Text>
          </View>
        ) : null}

        <View>
          <Text className="mb-2 text-base font-bold text-puce-red">
            Community reviews {otherReviews.length ? `(${otherReviews.length})` : ""}
          </Text>
          {otherReviews.length === 0 ? (
            <Text className="text-ink-muted">No reviews yet. Be the first to share your thoughts.</Text>
          ) : (
            otherReviews.map((review) => <ReviewItem key={review.id} review={review} />)
          )}
        </View>
      </ScrollView>

      <RateReviewSheet
        visible={rateOpen}
        onClose={() => setRateOpen(false)}
        userId={userId as string}
        book={book}
        userBookId={userBook?.id ?? null}
        existingReview={ownReview}
        onSaved={invalidate}
      />

      {/* Progress modal */}
      <Modal transparent visible={progressOpen} animationType="fade" onRequestClose={() => setProgressOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={() => setProgressOpen(false)}>
          <View className="w-72 rounded-2xl bg-surface p-5">
            <Text className="mb-3 text-lg font-bold text-puce-red">Update progress</Text>
            <TextInput
              value={progressValue}
              onChangeText={setProgressValue}
              keyboardType="number-pad"
              placeholder="Percent (0–100)"
              placeholderTextColor="#A99DAE"
              className="rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
            />
            <View className="mt-4">
              <Button title="Save" onPress={saveProgress} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
