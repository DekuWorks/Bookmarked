import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BookCoverAmbience } from "../../../src/components/BookCoverAmbience";
import { BookCover } from "../../../src/components/BookCover";
import { Button } from "../../../src/components/Button";
import { EmptyState } from "../../../src/components/EmptyState";
import { FeelingChip } from "../../../src/components/FeelingChip";
import { LoadingState } from "../../../src/components/LoadingState";
import { ProfanityBlur } from "../../../src/components/ProfanityBlur";
import { ProgressBar } from "../../../src/components/ProgressBar";
import { MarkFinishedSheet } from "../../../src/components/MarkFinishedSheet";
import { RateBookPromptSheet } from "../../../src/components/RateBookPromptSheet";
import { RateReviewSheet } from "../../../src/components/RateReviewSheet";
import { ReadingJournalSection } from "../../../src/components/ReadingJournalSection";
import { ReadingNotesSection } from "../../../src/components/ReadingNotesSection";
import { SavedPill } from "../../../src/components/SavedPill";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { ShelfIcon } from "../../../src/components/ShelfIcon";
import { StarRating } from "../../../src/components/StarRating";
import { getBookDetails } from "../../../src/services/bookDetails";
import {
  addAnotherRead,
  markFinished,
  setDnf,
  setExpectedReadDate,
  setShelfStatus,
  updateReadingProgress,
} from "../../../src/services/library";
import { useAuthStore } from "../../../src/store/authStore";
import type { Review, ReadingSession, ShelfStatus } from "../../../src/types";

const SHELVES: { status: ShelfStatus; label: string }[] = [
  { status: "want_to_read", label: "TBR" },
  { status: "currently_reading", label: "Reading" },
  { status: "read", label: "Finished" },
];

function ReviewItem({ review }: { review: Review }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const name = review.profiles?.display_name?.trim() || review.profiles?.username?.trim() || "Reader";
  const username = review.profiles?.username?.trim();
  const hidden = review.has_spoilers && !revealed;
  return (
    <View className="mb-3 rounded-2xl border border-brand-border bg-surface p-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => username && router.push(`/reader/${username}`)}
          disabled={!username}
          className="active:opacity-80"
        >
          <Text className="font-semibold text-ink">{name}</Text>
        </Pressable>
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
          <ProfanityBlur text={review.review_body} className="mt-2">
            <Text className="leading-5 text-ink">{review.review_body}</Text>
          </ProfanityBlur>
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
  const router = useRouter();

  const [rateOpen, setRateOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [ratePromptOpen, setRatePromptOpen] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [sessionOverrides, setSessionOverrides] = useState<Record<string, ReadingSession>>({});

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
  const readingSessions = useMemo(() => {
    const base = data?.readingSessions ?? [];
    return base.map((session) => sessionOverrides[session.id] ?? session);
  }, [data?.readingSessions, sessionOverrides]);

  function handleSessionUpdate(updated: ReadingSession) {
    setSessionOverrides((prev) => ({ ...prev, [updated.id]: updated }));
  }

  async function changeShelf(shelf: ShelfStatus) {
    if (!userId || !book) return;
    const result = await setShelfStatus(userId, book, shelf);
    if (result.error) Alert.alert("Error", result.error);
    invalidate();
  }

  async function finish() {
    setFinishOpen(true);
  }

  async function confirmFinish(finishedAt: string) {
    if (!userId || !book) return;
    setFinishLoading(true);
    const result = await markFinished(userId, book, { finishedAt });
    setFinishLoading(false);
    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }
    setFinishOpen(false);
    invalidate();
    if (result.promptReview) {
      setRatePromptOpen(true);
    }
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

  async function toggleDnf() {
    if (!userId || !book) return;
    const next = !(data?.userBook?.dnf ?? false);
    const result = await setDnf(userId, book.id, next);
    if (result.error) Alert.alert("Error", result.error);
    invalidate();
  }

  function startAnotherRead() {
    if (!userId || !book) return;
    Alert.alert(
      "Add another read",
      "Start a fresh read of this book? Your past reviews and reading sessions stay saved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start read",
          onPress: async () => {
            const result = await addAnotherRead(userId, book);
            if (result.error) Alert.alert("Error", result.error);
            else if (result.readNumber) {
              Alert.alert("Started read", `This is now read #${result.readNumber}.`);
            }
            invalidate();
          },
        },
      ]
    );
  }

  async function saveExpectedDate() {
    if (!userId || !book) return;
    const trimmed = dateValue.trim();
    if (trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      Alert.alert("Invalid date", "Use the format YYYY-MM-DD (e.g. 2026-08-15).");
      return;
    }
    const result = await setExpectedReadDate(userId, book.id, trimmed || null);
    setDateOpen(false);
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
  const ownReviews = data?.ownReviews ?? [];
  const ownReview = ownReviews[0] ?? null;
  const readCount = userBook?.read_count ?? 1;
  const otherReviews = (data?.reviews ?? []).filter((r) => r.user_id !== userId);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={book.title} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, gap: 16 }}>
        <BookCoverAmbience>
          <View className="items-center">
            <BookCover
              url={book.cover_url}
              title={book.title}
              sizeClassName="w-32 h-48"
              saved={Boolean(userBook)}
              badgeSize="large"
            />
            <Text className="mt-4 text-center text-xl font-bold text-ink">{book.title}</Text>
            {book.author ? (
              <Pressable onPress={() => router.push(`/author/${encodeURIComponent(book.author!)}`)}>
                <Text className="mt-0.5 text-center text-ink-muted underline">{book.author}</Text>
              </Pressable>
            ) : null}
            {data?.communityRating ? (
              <View className="mt-3 flex-row items-center gap-2">
                <StarRating value={data.communityRating.averageRating} showNumber />
                <Text className="text-xs text-ink-muted">({data.communityRating.ratingCount})</Text>
              </View>
            ) : null}
          </View>
        </BookCoverAmbience>

        <View className="flex-row flex-wrap gap-2 justify-center">
          {book.series_name ? (
            <Pressable
              onPress={() => router.push(`/series/${encodeURIComponent(book.series_name!)}`)}
              className="rounded-full bg-primary/15 px-2.5 py-1 active:opacity-80"
            >
              <Text className="text-xs font-medium text-puce-red">
                Part of {book.series_name}
                {book.series_position != null ? ` #${book.series_position}` : ""}
              </Text>
            </Pressable>
          ) : null}
          {userBook ? <SavedPill shelf={userBook.shelf_status} /> : null}
        </View>

        {userBook?.finished_at ? (
          <Text className="text-center text-xs text-ink-muted">
            Finished on {new Date(userBook.finished_at).toLocaleDateString()}
          </Text>
        ) : null}

        {/* Shelf actions */}
        <View className="flex-row gap-2">
          {SHELVES.map((s) => {
            const active = userBook?.shelf_status === s.status;
            return (
              <Pressable
                key={s.status}
                onPress={() => changeShelf(s.status)}
                className={`flex-1 items-center gap-1 rounded-xl py-2.5 ${active ? "bg-puce-red" : "bg-primary/15"}`}
              >
                <ShelfIcon id={s.status} size="small" />
                <Text className={`text-sm font-semibold ${active ? "text-white" : "text-puce-red"}`}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {userBook ? (
          <View className="flex-row gap-2">
            <Pressable
              onPress={toggleDnf}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                userBook.dnf ? "bg-rust" : "bg-primary/15"
              }`}
            >
              <ShelfIcon id="dnf" size="small" />
              <Text className={`text-sm font-semibold ${userBook.dnf ? "text-white" : "text-puce-red"}`}>
                {userBook.dnf ? "Did not finish" : "Mark did not finish"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setDateValue(userBook.expected_read_date ?? "");
                setDateOpen(true);
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary/15 py-2.5"
            >
              <Text className="text-sm font-semibold text-puce-red" numberOfLines={1}>
                {userBook.expected_read_date
                  ? `📅 ${new Date(userBook.expected_read_date).toLocaleDateString()}`
                  : "Set date to read"}
              </Text>
            </Pressable>
          </View>
        ) : null}

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

        {userBook ? (
          <Pressable
            onPress={startAnotherRead}
            className="flex-row items-center justify-center gap-1.5 rounded-xl border border-brand-border py-3 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-puce-red">🔄 Add another read</Text>
          </Pressable>
        ) : null}

        {ownReviews.length ? (
          <View>
            <Text className="mb-2 text-base font-bold text-puce-red">
              {ownReviews.length > 1 ? `Your reading history (${ownReviews.length})` : "Your review"}
            </Text>
            {ownReviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </View>
        ) : null}

        {userBook ? (
          <>
            <ReadingJournalSection
              sessions={readingSessions}
              loading={details.isLoading}
              onSessionUpdate={handleSessionUpdate}
            />
            <ReadingNotesSection
              userId={userId as string}
              userBookId={userBook.id}
              initialNotes={data?.notes ?? []}
              onChanged={invalidate}
            />
          </>
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
        readNumber={readCount}
        onSaved={invalidate}
      />

      <MarkFinishedSheet
        visible={finishOpen}
        bookTitle={book.title}
        startedAt={userBook?.started_at}
        onClose={() => setFinishOpen(false)}
        onConfirm={(finishedAt) => void confirmFinish(finishedAt)}
        loading={finishLoading}
      />

      <RateBookPromptSheet
        visible={ratePromptOpen}
        bookTitle={book.title}
        onSkip={() => setRatePromptOpen(false)}
        onReviewNow={() => {
          setRatePromptOpen(false);
          setRateOpen(true);
        }}
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

      {/* Date to read modal */}
      <Modal transparent visible={dateOpen} animationType="fade" onRequestClose={() => setDateOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={() => setDateOpen(false)}>
          <View className="w-72 rounded-2xl bg-surface p-5">
            <Text className="mb-1 text-lg font-bold text-puce-red">Date to read</Text>
            <Text className="mb-3 text-xs text-ink-muted">
              When do you plan to read this? Leave blank to clear.
            </Text>
            <TextInput
              value={dateValue}
              onChangeText={setDateValue}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A99DAE"
              autoCapitalize="none"
              className="rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
            />
            <View className="mt-4">
              <Button title="Save" onPress={saveExpectedDate} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
