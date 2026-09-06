import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { originBackHref, parseNavOrigin } from "../../../../../packages/utils/navigationOrigin";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BookCoverAmbience } from "../../../src/components/BookCoverAmbience";
import { BookCover } from "../../../src/components/BookCover";
import { Button } from "../../../src/components/Button";
import { CompletionCelebration } from "../../../src/components/CompletionCelebration";
import { CommunityContentTags } from "../../../src/components/CommunityContentTags";
import { EmptyState } from "../../../src/components/EmptyState";
import { FeelingChip } from "../../../src/components/FeelingChip";
import { LoadingState } from "../../../src/components/LoadingState";
import { ProfanityBlur } from "../../../src/components/ProfanityBlur";
import { ProgressBar } from "../../../src/components/ProgressBar";
import { MarkFinishedSheet } from "../../../src/components/MarkFinishedSheet";
import { RateBookPromptSheet } from "../../../src/components/RateBookPromptSheet";
import { RateReviewSheet } from "../../../src/components/RateReviewSheet";
import { PrivateReviewBadge } from "../../../src/components/PrivateReviewBadge";
import { ReviewVisibilityControl } from "../../../src/components/ReviewVisibilityControl";
import { updateReviewVisibility } from "../../../src/services/reviews";
import {
  isPrivateReview,
  isPublicReview,
  parseReviewAudience,
  type ReviewAudience,
} from "../../../../../packages/utils/reviewVisibility";
import { ReadingJournalSection } from "../../../src/components/ReadingJournalSection";
import { ReadingNotesSection } from "../../../src/components/ReadingNotesSection";
import { SavedPill } from "../../../src/components/SavedPill";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { ShelfIcon } from "../../../src/components/ShelfIcon";
import { StarRating } from "../../../src/components/StarRating";
import { getBookDetails } from "../../../src/services/bookDetails";
import {
  addAnotherRead,
  logListeningSession,
  markFinished,
  setDnf,
  setShelfStatus,
  updateBookFormat,
  updateBookTotalPages,
  updateReadingProgress,
} from "../../../src/services/library";
import { ListeningTimeInput } from "../../../src/components/ListeningTimeInput";
import {
  addBookToCustomShelf,
  listCustomShelfIdsForBook,
  listUserCustomShelves,
} from "../../../src/services/customShelves";
import type { UserShelf } from "../../../src/types";
import {
  resolveUserEditionTotalPages,
  validatePageProgress,
} from "../../../../../packages/utils/pageProgress";
import {
  combineListeningTimeParts,
  formatAudiobookProgressLabel,
  listeningTimeParts,
  parseListeningTime,
  resolveAudiobookDurationSeconds,
  resolveTrackingFormat,
} from "../../../../../packages/utils/listeningTime";
import { needsMissingPageCountPrompt } from "../../../src/services/completeReadingSession";
import { TAB_BAR_SPACE } from "../../../src/navigation/TabBarScroll";
import { useAuthStore } from "../../../src/store/authStore";
import type { Review, ReadingSession, ShelfStatus } from "../../../src/types";

const SHELVES: { status: ShelfStatus; label: string }[] = [
  { status: "want_to_read", label: "TBR" },
  { status: "currently_reading", label: "Reading" },
  { status: "read", label: "Finished" },
];

function ReviewItem({
  review,
  isOwn = false,
  onVisibilityChange,
}: {
  review: Review;
  isOwn?: boolean;
  onVisibilityChange?: () => void;
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [visibility, setVisibility] = useState<ReviewAudience>(
    parseReviewAudience(review.visibility)
  );
  const [saving, setSaving] = useState(false);
  const [prevReviewVisibility, setPrevReviewVisibility] = useState(review.visibility);
  if (review.visibility !== prevReviewVisibility) {
    setPrevReviewVisibility(review.visibility);
    setVisibility(parseReviewAudience(review.visibility));
  }
  const name = review.profiles?.display_name?.trim() || review.profiles?.username?.trim() || "Reader";
  const username = review.profiles?.username?.trim();
  const hidden = review.has_spoilers && !revealed;

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
    onVisibilityChange?.();
  }

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
        <View className="flex-row items-center gap-2">
          {isOwn && isPrivateReview(visibility) ? <PrivateReviewBadge compact /> : null}
          {review.read_number > 1 ? (
            <Text className="text-xs text-primary-dark">Read #{review.read_number}</Text>
          ) : null}
        </View>
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
      {isOwn ? (
        <View className="mt-3">
          <ReviewVisibilityControl
            value={visibility}
            disabled={saving}
            onChange={(next) => void persistVisibility(next)}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function BookScreen() {
  const { id, origin: originParam, section } = useLocalSearchParams<{
    id: string;
    origin?: string;
    section?: string;
  }>();
  const bookId = String(id);
  const origin = parseNavOrigin(typeof originParam === "string" ? originParam : null);
  const backHref = originBackHref(origin, "mobile") ?? "/search";
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const router = useRouter();

  const scrollRef = useRef<ScrollView>(null);
  const reviewsY = useRef(0);
  const [rateOpen, setRateOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [ratePromptOpen, setRatePromptOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [challengeUpdates, setChallengeUpdates] = useState<
    import("../../../../../packages/utils/challengeTypes").ChallengeEvaluationSummary | null
  >(null);
  const [finishLoading, setFinishLoading] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [progressValue, setProgressValue] = useState("");
  const [totalPagesValue, setTotalPagesValue] = useState("");
  const [currentHours, setCurrentHours] = useState("");
  const [currentMinutes, setCurrentMinutes] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [totalMinutes, setTotalMinutes] = useState("");
  const [sessionStartHours, setSessionStartHours] = useState("");
  const [sessionStartMinutes, setSessionStartMinutes] = useState("");
  const [sessionEndHours, setSessionEndHours] = useState("");
  const [sessionEndMinutes, setSessionEndMinutes] = useState("");
  const [totalPagesOpen, setTotalPagesOpen] = useState(false);
  const [formatPending, setFormatPending] = useState(false);
  const [sessionOverrides, setSessionOverrides] = useState<Record<string, ReadingSession>>({});
  const [customShelves, setCustomShelves] = useState<UserShelf[]>([]);
  const [memberShelfIds, setMemberShelfIds] = useState<string[]>([]);

  const details = useQuery({
    queryKey: ["book-details", bookId, userId],
    queryFn: () => getBookDetails(bookId, userId as string),
    enabled: Boolean(userId) && Boolean(bookId),
  });

  useEffect(() => {
    if (!userId) return;
    void listUserCustomShelves(userId)
      .then(setCustomShelves)
      .catch((error) => console.error("[custom-shelf] list failed:", error));
  }, [userId]);

  useEffect(() => {
    if (!userId || !bookId) return;
    void listCustomShelfIdsForBook(userId, bookId)
      .then(setMemberShelfIds)
      .catch((error) => console.error("[custom-shelf] membership load failed:", error));
  }, [userId, bookId, details.data?.userBook?.id]);

  useEffect(() => {
    if (section !== "reviews" || !details.data) return;
    setRateOpen(true);
    const handle = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, reviewsY.current - 16), animated: true });
    }, 250);
    return () => clearTimeout(handle);
  }, [section, details.data]);

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["book-details", bookId, userId] });
    await queryClient.invalidateQueries({ queryKey: ["library"] });
    await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
  }

  const data = details.data;
  const book = data?.book;
  const trackingFormat = resolveTrackingFormat({
    userFormat: data?.userBook?.tracking_format,
    catalogFormat: book?.format,
  });
  const isAudiobook = trackingFormat === "audiobook";
  const totalListeningSeconds = resolveAudiobookDurationSeconds({
    userDurationSeconds: data?.userBook?.audiobook_duration_seconds,
    catalogDurationSeconds: book?.audiobook_duration_seconds,
  });
  const readingSessions = useMemo(() => {
    const base = data?.readingSessions ?? [];
    return base.map((session) => sessionOverrides[session.id] ?? session);
  }, [data?.readingSessions, sessionOverrides]);

  function handleSessionUpdate(updated: ReadingSession) {
    setSessionOverrides((prev) => ({ ...prev, [updated.id]: updated }));
  }

  async function applyShelf(shelf: ShelfStatus, manualPageCount?: number) {
    if (!userId || !book) return;
    const queryKey = ["book-details", bookId, userId] as const;
    const previous = queryClient.getQueryData(queryKey);
    // Optimistic shelf badge for existing library rows — rolls back on failure.
    if (details.data?.userBook) {
      queryClient.setQueryData(queryKey, (current: typeof details.data) => {
        if (!current?.userBook) return current;
        return {
          ...current,
          userBook: {
            ...current.userBook,
            shelf_status: shelf,
            dnf: shelf === "dnf",
            finished_at: shelf === "dnf" ? null : current.userBook.finished_at,
          },
        };
      });
    }

    const result = await setShelfStatus(userId, book, shelf, { manualPageCount });
    if (result.error) {
      queryClient.setQueryData(queryKey, previous);
      Alert.alert("Error", result.error);
      return;
    }
    await invalidate();
  }

  async function changeShelf(shelf: ShelfStatus) {
    if (!userId || !book) return;
    if (
      shelf === "read" &&
      needsMissingPageCountPrompt({
        editionSelected: Boolean(book.isbn),
        catalogPageCount: book.page_count,
        previousPage: Number(data?.userBook?.progress_pages) || 0,
      })
    ) {
      Alert.alert(
        "Page count needed",
        "This book has no page count in the catalog. Finish without pages, or enter the total.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Finish without pages", onPress: () => void applyShelf(shelf) },
          {
            text: "Enter pages",
            onPress: () => {
              if (typeof Alert.prompt !== "function") {
                Alert.alert(
                  "Page count unavailable",
                  "Finish without pages for now, or add the book from search where page entry is supported."
                );
                return;
              }
              Alert.prompt(
                "Total pages",
                "How many pages is this book?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Save",
                    onPress: (value?: string) => {
                      const manualPageCount = Number.parseInt(String(value ?? "").trim(), 10);
                      if (!Number.isFinite(manualPageCount) || manualPageCount <= 0) {
                        Alert.alert("Invalid page count", "Enter a whole number greater than zero.");
                        return;
                      }
                      void applyShelf(shelf, manualPageCount);
                    },
                  },
                ],
                "plain-text",
                "",
                "number-pad"
              );
            },
          },
        ]
      );
      return;
    }
    await applyShelf(shelf);
  }

  async function addToCustomCollection(shelf: UserShelf) {
    if (!userId || !book) return;
    const result = await addBookToCustomShelf(shelf.id, userId, book.id);
    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }
    setMemberShelfIds((prev) => (prev.includes(shelf.id) ? prev : [...prev, shelf.id]));
    await invalidate();
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
    setChallengeUpdates(result.challengeUpdates ?? null);
    setCelebrationOpen(true);
    if (result.promptReview) {
      setRatePromptOpen(true);
    }
  }

  async function saveProgress() {
    if (!userId || !book) return;
    if (isAudiobook) {
      const result = await updateReadingProgress(userId, book, {
        progressPercent: 0,
        format: "audiobook",
        currentListeningTime: combineListeningTimeParts(currentHours, currentMinutes),
        totalListeningTime: combineListeningTimeParts(totalHours, totalMinutes),
      });
      setProgressOpen(false);
      if (result.error) Alert.alert("Error", result.error);
      invalidate();
      return;
    }

    const validated = validatePageProgress({
      currentPage: progressValue,
      totalPages: totalPagesValue,
    });
    if (!validated.ok) {
      Alert.alert("Invalid progress", validated.error);
      return;
    }
    const result = await updateReadingProgress(userId, book, {
      progressPages: validated.currentPage,
      progressPercent: validated.percent,
      totalPages: validated.totalPages,
    });
    setProgressOpen(false);
    setProgressValue("");
    setTotalPagesValue("");
    if (result.error) Alert.alert("Error", result.error);
    invalidate();
  }

  function fillListeningFields(currentSeconds: number, totalSeconds: number) {
    const current = listeningTimeParts(currentSeconds);
    const total = listeningTimeParts(totalSeconds);
    setCurrentHours(currentSeconds > 0 || totalSeconds > 0 ? current.hours : "");
    setCurrentMinutes(currentSeconds > 0 || totalSeconds > 0 ? current.minutes : "");
    setTotalHours(totalSeconds > 0 ? total.hours : "");
    setTotalMinutes(totalSeconds > 0 ? total.minutes : "");
    setSessionStartHours(currentSeconds > 0 ? current.hours : "");
    setSessionStartMinutes(currentSeconds > 0 ? current.minutes : "");
  }

  async function saveListeningSession() {
    if (!userId || !book) return;
    const result = await logListeningSession(userId, book, {
      startTime: combineListeningTimeParts(sessionStartHours, sessionStartMinutes),
      endTime: combineListeningTimeParts(sessionEndHours, sessionEndMinutes),
      currentListeningSeconds: data?.userBook?.listening_progress_seconds,
      totalListeningSeconds,
    });
    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }
    setSessionOpen(false);
    setSessionEndHours("");
    setSessionEndMinutes("");
    await invalidate();
  }

  async function selectFormat(next: "book" | "audiobook") {
    if (!book || !userId || trackingFormat === next || formatPending) return;
    setFormatPending(true);
    const result = await updateBookFormat(userId, book.id, next);
    setFormatPending(false);
    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }
    await invalidate();
    if (next === "audiobook") {
      fillListeningFields(
        Number(data?.userBook?.listening_progress_seconds) || 0,
        totalListeningSeconds
      );
      setProgressOpen(true);
    }
  }

  async function saveTotalPages() {
    if (!book || !userId) return;
    const totalPages = Number.parseInt(totalPagesValue.trim(), 10);
    const currentPage = Number(data?.userBook?.progress_pages) || 0;
    const result = await updateBookTotalPages(userId, book.id, totalPages, currentPage);
    if (result.error) {
      Alert.alert("Couldn't update total pages", result.error);
      return;
    }
    setTotalPagesOpen(false);
    setTotalPagesValue("");
    await invalidate();
  }

  async function toggleDnf() {
    if (!userId || !book) return;
    const next = !(data?.userBook?.dnf ?? false);
    const queryKey = ["book-details", bookId, userId] as const;
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (current: typeof details.data) => {
      if (!current?.userBook) return current;
      return {
        ...current,
        userBook: {
          ...current.userBook,
          dnf: next,
          shelf_status: next ? "dnf" : "currently_reading",
          finished_at: next ? null : current.userBook.finished_at,
        },
      };
    });
    const result = await setDnf(userId, book.id, next);
    if (result.error) {
      queryClient.setQueryData(queryKey, previous);
      Alert.alert("Error", result.error);
      return;
    }
    await invalidate();
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

  if (details.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Book" fallbackHref={backHref} />
        <LoadingState message="Loading book…" />
      </View>
    );
  }

  if (!book) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Book" fallbackHref={backHref} />
        <EmptyState title="Book not found" description="This book may have been removed." />
      </View>
    );
  }

  const userBook = data?.userBook ?? null;
  const ownReviews = data?.ownReviews ?? [];
  const ownReview = ownReviews[0] ?? null;
  const readCount = userBook?.read_count ?? 1;
  const otherReviews = (data?.reviews ?? []).filter(
    (r) => r.user_id !== userId && isPublicReview(r.visibility)
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={book.title} fallbackHref={backHref} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE, gap: 16 }}
      >
        <BookCoverAmbience>
          <View className="items-center">
            <BookCover
              url={book.cover_url}
              title={book.title}
              sizeClassName="w-32 h-48"
              saved={Boolean(userBook)}
              badgeSize="large"
              priority
            />
            <Text className="mt-4 text-center text-xl font-bold text-ink">{book.title}</Text>
            {book.author ? (
              <Pressable onPress={() => router.push(`/author/${encodeURIComponent(book.author!)}`)}>
                <Text className="mt-0.5 text-center text-ink-muted underline">{book.author}</Text>
              </Pressable>
            ) : null}
            {data?.communityRating ? (
              <View className="mt-3 items-center gap-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Bookmarked rating
                </Text>
                <View className="flex-row items-center gap-2">
                  <StarRating value={data.communityRating.averageRating} showNumber />
                  <Text className="text-xs text-ink-muted">
                    ({data.communityRating.ratingCount}{" "}
                    {data.communityRating.ratingCount === 1 ? "rating" : "ratings"})
                  </Text>
                </View>
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

        <View className="items-center gap-1.5">
          <Text className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Track as
          </Text>
          <View className="flex-row rounded-full border border-brand-border bg-surface p-1">
            <Pressable
              disabled={formatPending || !userBook}
              onPress={() => selectFormat("book")}
              className={`rounded-full px-3.5 py-1.5 ${isAudiobook ? "" : "bg-puce-red"}`}
            >
              <Text
                className={`text-xs font-semibold ${isAudiobook ? "text-primary-dark" : "text-white"}`}
              >
                📖 Book
              </Text>
            </Pressable>
            <Pressable
              disabled={formatPending || !userBook}
              onPress={() => selectFormat("audiobook")}
              className={`rounded-full px-3.5 py-1.5 ${isAudiobook ? "bg-puce-red" : ""}`}
            >
              <Text
                className={`text-xs font-semibold ${isAudiobook ? "text-white" : "text-primary-dark"}`}
              >
                🎧 Audiobook
              </Text>
            </Pressable>
          </View>
          <Text className="max-w-xs text-center text-[11px] text-ink-muted">
            {!userBook
              ? "Add this book to a shelf to choose book or audiobook tracking."
              : isAudiobook
                ? "Listening time below. Page history is kept."
                : "Page tracking. Listening history is kept if you switch formats."}
          </Text>
        </View>

        {!isAudiobook && userBook ? (
          <Pressable
            onPress={() => {
              const editionTotal = resolveUserEditionTotalPages({
                userTotalPages: userBook.total_pages,
                catalogPageCount: book.page_count,
              });
              setTotalPagesValue(editionTotal ? String(editionTotal) : "");
              setTotalPagesOpen(true);
            }}
            className="self-center rounded-full border border-brand-border bg-surface px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-primary-dark">
              {(() => {
                const editionTotal = resolveUserEditionTotalPages({
                  userTotalPages: userBook.total_pages,
                  catalogPageCount: book.page_count,
                });
                const current = userBook.progress_pages ?? 0;
                return editionTotal
                  ? `Page ${current} of ${editionTotal} · Edit`
                  : "Add current page + total pages";
              })()}
            </Text>
          </Pressable>
        ) : null}

        {isAudiobook && userBook ? (
          <Pressable
            onPress={() => {
              fillListeningFields(
                Number(userBook.listening_progress_seconds) || 0,
                totalListeningSeconds
              );
              setProgressOpen(true);
            }}
            className="self-center rounded-full border border-brand-border bg-surface px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-primary-dark">
              {totalListeningSeconds > 0
                ? `${formatAudiobookProgressLabel(
                    Number(userBook.listening_progress_seconds) || 0,
                    totalListeningSeconds
                  )} · ${Math.round(userBook.progress_percent ?? 0)}% · Edit`
                : "Add current + total listening time"}
            </Text>
          </Pressable>
        ) : null}

        {isAudiobook && userBook && userBook.shelf_status !== "currently_reading" ? (
          <Pressable
            onPress={() => {
              fillListeningFields(
                Number(userBook.listening_progress_seconds) || 0,
                totalListeningSeconds
              );
              setSessionEndHours("");
              setSessionEndMinutes("");
              setSessionOpen(true);
            }}
            className="self-center rounded-full border border-brand-border bg-surface px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-primary-dark">Log listening session</Text>
          </Pressable>
        ) : null}

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
                className={`min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 ${active ? "bg-puce-red" : "bg-primary/15"}`}
              >
                <ShelfIcon id={s.status} size="small" />
                <Text
                  className={`text-sm font-semibold leading-tight ${active ? "text-white" : "text-puce-red"}`}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {userBook ? (
          <Pressable
            onPress={toggleDnf}
            className={`min-h-[44px] flex-row items-center justify-center gap-2 rounded-xl py-2.5 ${
              userBook.dnf ? "bg-rust" : "bg-primary/15"
            }`}
          >
            <ShelfIcon id="dnf" size="small" />
            <Text
              className={`text-sm font-semibold leading-tight ${userBook.dnf ? "text-white" : "text-puce-red"}`}
            >
              {userBook.dnf ? "Did not finish" : "Mark did not finish"}
            </Text>
          </Pressable>
        ) : null}

        {customShelves.length ? (
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Custom shelves
            </Text>
            {customShelves.map((shelf) => {
              const isMember = memberShelfIds.includes(shelf.id);
              return (
                <Pressable
                  key={shelf.id}
                  disabled={isMember}
                  onPress={() => void addToCustomCollection(shelf)}
                  className={`min-h-[44px] flex-row items-center gap-2 rounded-xl border px-4 py-2.5 ${
                    isMember ? "border-primary bg-primary/10" : "border-brand-border bg-surface"
                  }`}
                >
                  <ShelfIcon iconKey={shelf.icon_key} size="small" />
                  <Text className="flex-1 font-semibold text-puce-red">{shelf.name}</Text>
                  {isMember ? (
                    <Text className="text-xs font-semibold text-primary-dark">On shelf</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {userBook?.shelf_status === "currently_reading" ? (
          <View className="rounded-2xl border border-brand-border bg-surface p-4">
            <Text className="mb-2 font-semibold text-ink">
              {isAudiobook ? "Listening progress" : "Reading progress"}
            </Text>
            <ProgressBar percent={userBook.progress_percent ?? 0} />
            <Text className="mt-1 text-xs text-ink-muted">
              {isAudiobook
                ? totalListeningSeconds > 0
                  ? `${formatAudiobookProgressLabel(
                      Number(userBook.listening_progress_seconds) || 0,
                      totalListeningSeconds
                    )} · ${Math.round(userBook.progress_percent ?? 0)}%`
                  : `${Math.round(userBook.progress_percent ?? 0)}%`
                : (() => {
                    const total = resolveUserEditionTotalPages({
                      userTotalPages: userBook.total_pages,
                      catalogPageCount: book.page_count,
                    });
                    return total
                      ? `Page ${userBook.progress_pages ?? 0} of ${total} · ${userBook.progress_percent ?? 0}%`
                      : `${userBook.progress_percent ?? 0}%`;
                  })()}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button
                  title="Update progress"
                  variant="ghost"
                  onPress={() => {
                    if (isAudiobook) {
                      fillListeningFields(
                        Number(userBook.listening_progress_seconds) || 0,
                        totalListeningSeconds
                      );
                    } else {
                      setProgressValue(String(userBook.progress_pages ?? 0));
                      setTotalPagesValue(
                        String(
                          resolveUserEditionTotalPages({
                            userTotalPages: userBook.total_pages,
                            catalogPageCount: book.page_count,
                          }) || ""
                        )
                      );
                    }
                    setProgressOpen(true);
                  }}
                />
              </View>
              <View className="flex-1">
                <Button title="Mark finished" onPress={finish} />
              </View>
            </View>
            {isAudiobook ? (
              <View className="mt-2">
                <Button
                  title="Log listening session"
                  variant="ghost"
                  onPress={() => {
                    fillListeningFields(
                      Number(userBook.listening_progress_seconds) || 0,
                      totalListeningSeconds
                    );
                    setSessionEndHours("");
                    setSessionEndMinutes("");
                    setSessionOpen(true);
                  }}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <View
          onLayout={(event) => {
            reviewsY.current = event.nativeEvent.layout.y;
          }}
        >
          <Button
            title={ownReview ? "Edit your review" : "Rate & review"}
            variant="secondary"
            onPress={() => setRateOpen(true)}
          />
        </View>

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
              <ReviewItem
                key={review.id}
                review={review}
                isOwn
                onVisibilityChange={invalidate}
              />
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

        <CommunityContentTags bookId={book.id} canVote={userBook?.shelf_status === "read"} />

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

      <CompletionCelebration
        visible={celebrationOpen}
        bookTitle={book.title}
        challengeUpdates={challengeUpdates}
        onClose={() => setCelebrationOpen(false)}
      />

      {/* Progress modal */}
      <Modal transparent visible={progressOpen} animationType="fade" onRequestClose={() => setProgressOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={() => setProgressOpen(false)}>
          <Pressable className="w-80 rounded-2xl bg-surface p-5" onPress={(event) => event.stopPropagation()}>
            <Text className="mb-3 text-lg font-bold text-puce-red">Update progress</Text>
            {isAudiobook ? (
              <View className="gap-4">
                <ListeningTimeInput
                  label="Current Listening Time"
                  hint="Enter your current listening position in hours and minutes."
                  hours={currentHours}
                  minutes={currentMinutes}
                  onHoursChange={setCurrentHours}
                  onMinutesChange={setCurrentMinutes}
                  onBlur={() => {
                    const parsed = parseListeningTime(
                      combineListeningTimeParts(currentHours, currentMinutes)
                    );
                    if (parsed.ok) {
                      const parts = listeningTimeParts(parsed.seconds);
                      setCurrentHours(parts.hours);
                      setCurrentMinutes(parts.minutes);
                    }
                  }}
                />
                <ListeningTimeInput
                  label="Total Listening Time"
                  hint="Enter the audiobook's total length in hours and minutes."
                  hours={totalHours}
                  minutes={totalMinutes}
                  onHoursChange={setTotalHours}
                  onMinutesChange={setTotalMinutes}
                  onBlur={() => {
                    const parsed = parseListeningTime(
                      combineListeningTimeParts(totalHours, totalMinutes)
                    );
                    if (parsed.ok) {
                      const parts = listeningTimeParts(parsed.seconds);
                      setTotalHours(parts.hours);
                      setTotalMinutes(parts.minutes);
                    }
                  }}
                />
              </View>
            ) : (
              <>
                <TextInput
                  value={progressValue}
                  onChangeText={setProgressValue}
                  keyboardType="number-pad"
                  placeholder="Current page"
                  placeholderTextColor="#A99DAE"
                  className="rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
                />
                <TextInput
                  value={totalPagesValue}
                  onChangeText={setTotalPagesValue}
                  keyboardType="number-pad"
                  placeholder="Total pages"
                  placeholderTextColor="#A99DAE"
                  className="mt-3 rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
                />
              </>
            )}
            <View className="mt-4">
              <Button title="Save" onPress={saveProgress} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={sessionOpen} animationType="fade" onRequestClose={() => setSessionOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={() => setSessionOpen(false)}>
          <Pressable className="w-80 rounded-2xl bg-surface p-5" onPress={(event) => event.stopPropagation()}>
            <Text className="mb-3 text-lg font-bold text-puce-red">Log listening session</Text>
            <View className="gap-4">
              <ListeningTimeInput
                label="Starting Listening Position"
                hint="Hours and minutes, such as 1:45."
                hours={sessionStartHours}
                minutes={sessionStartMinutes}
                onHoursChange={setSessionStartHours}
                onMinutesChange={setSessionStartMinutes}
                onBlur={() => {
                  const parsed = parseListeningTime(
                    combineListeningTimeParts(sessionStartHours, sessionStartMinutes)
                  );
                  if (parsed.ok) {
                    const parts = listeningTimeParts(parsed.seconds);
                    setSessionStartHours(parts.hours);
                    setSessionStartMinutes(parts.minutes);
                  }
                }}
              />
              <ListeningTimeInput
                label="Ending Listening Position"
                hint="Hours and minutes, such as 2:30."
                hours={sessionEndHours}
                minutes={sessionEndMinutes}
                onHoursChange={setSessionEndHours}
                onMinutesChange={setSessionEndMinutes}
                onBlur={() => {
                  const parsed = parseListeningTime(
                    combineListeningTimeParts(sessionEndHours, sessionEndMinutes)
                  );
                  if (parsed.ok) {
                    const parts = listeningTimeParts(parsed.seconds);
                    setSessionEndHours(parts.hours);
                    setSessionEndMinutes(parts.minutes);
                  }
                }}
              />
            </View>
            <View className="mt-4">
              <Button title="Save session" onPress={() => void saveListeningSession()} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={totalPagesOpen} animationType="fade" onRequestClose={() => setTotalPagesOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={() => setTotalPagesOpen(false)}>
          <View className="w-72 rounded-2xl bg-surface p-5">
            <Text className="mb-1 text-lg font-bold text-puce-red">Total pages</Text>
            <Text className="mb-3 text-xs text-ink-muted">
              Your edition page count. This does not change the catalog listing.
            </Text>
            <TextInput
              value={totalPagesValue}
              onChangeText={setTotalPagesValue}
              keyboardType="number-pad"
              placeholder="e.g. 384"
              placeholderTextColor="#A99DAE"
              className="rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
            />
            <View className="mt-4">
              <Button title="Save total pages" onPress={saveTotalPages} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
