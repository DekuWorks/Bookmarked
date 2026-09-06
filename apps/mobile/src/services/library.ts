import { completeReadingSession } from "./completeReadingSession";
import { createReadingSession } from "./readingSessions";
import { supabase } from "./supabase";
import { getShelvesInOrder } from "../constants/shelves";
import {
  activityMetadata,
  bookActivityContext,
  recordActivity,
  type ActivityEventType,
} from "./activity";
import { buildUserBookShelfPatch } from "../../../../packages/utils/shelfStatus";
import {
  calculateAudiobookProgress,
  nextListeningProgressAfterSession,
  resolveAudiobookDurationSeconds,
  validateListeningProgress,
  validateListeningSession,
} from "../../../../packages/utils/listeningTime";
import type { ShelfMoveDestination } from "../../../../packages/utils/shelfMove";
import type { ShelfStatus, UserBook } from "../types";
import { addBookToCustomShelf } from "./customShelves";

async function evaluateProgressForChallenges(input: {
  userId: string;
  userBookId: string;
  qualifyingEventId: string;
  qualifyingDate: string;
  pagesInEvent: number;
  listeningSecondsInEvent: number;
}): Promise<void> {
  try {
    const { evaluateQualifyingEventForChallenges } = await import(
      "./challenges/ChallengeContributionService"
    );
    await evaluateQualifyingEventForChallenges({
      ...input,
      eventKind: "progress",
    });
  } catch (error) {
    console.warn("[library] challenge progress evaluate skipped:", error);
  }
}

export type LibraryBookRow = {
  id: string;
  shelf_status: ShelfStatus;
  progress_percent: number;
  progress_pages: number;
  rating: number | null;
  is_favorite: boolean;
  finished_at: string | null;
  started_at: string | null;
  completion_tags: string[] | null;
  dnf: boolean;
  expected_read_date: string | null;
  total_pages?: number | null;
  tracking_format?: "book" | "audiobook" | null;
  listening_progress_seconds?: number;
  audiobook_duration_seconds?: number | null;
  updated_at: string;
  created_at: string;
  books: {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    page_count: number | null;
    published_date: string | null;
    subjects: string[] | null;
    format: "book" | "ebook" | "audiobook" | null;
  } | null;
};

export type ShelfGroup = {
  status: ShelfStatus;
  title: string;
  slug: string;
  items: LibraryBookRow[];
};

const LIBRARY_SELECT =
  "id, shelf_status, progress_percent, progress_pages, total_pages, tracking_format, listening_progress_seconds, audiobook_duration_seconds, rating, is_favorite, finished_at, started_at, completion_tags, dnf, expected_read_date, created_at, updated_at, books(id, title, author, cover_url, page_count, published_date, subjects, format, audiobook_duration_seconds)";

export async function getUserLibraryBooks(userId: string): Promise<LibraryBookRow[]> {
  const { data, error } = await supabase
    .from("user_books")
    .select(LIBRARY_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as LibraryBookRow[];
}

export function groupBooksByShelf(books: LibraryBookRow[]): ShelfGroup[] {
  return getShelvesInOrder().map((shelf) => ({
    status: shelf.status,
    title: shelf.title,
    slug: shelf.slug,
    items: books.filter((b) => b.shelf_status === shelf.status),
  }));
}

/** Removes every book with this shelf status from the user's library. Other shelf statuses are untouched. */
export async function clearBuiltInShelf(
  userId: string,
  status: ShelfStatus
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("user_id", userId)
    .eq("shelf_status", status);

  if (error) return { error: error.message };
  return {};
}

/** Profile shelf preview — top N covers per shelf (web uses 4; mobile defaults to 3). */
export function buildShelfPreview(
  books: LibraryBookRow[],
  limitPerShelf = 3
): ShelfGroup[] {
  return groupBooksByShelf(books).map((shelf) => ({
    ...shelf,
    items: shelf.items.slice(0, limitPerShelf),
  }));
}

export function buildFullShelves(books: LibraryBookRow[]): ShelfGroup[] {
  return groupBooksByShelf(books);
}


// ---- Sorting (mirrors web useShelfSort) --------------------------------------

export type ShelfSort =
  | "recent"
  | "title"
  | "author"
  | "date_released"
  | "date_added";

export const SHELF_SORT_OPTIONS: { id: ShelfSort; label: string }[] = [
  { id: "recent", label: "Recent progress" },
  { id: "title", label: "Title" },
  { id: "author", label: "Author" },
  { id: "date_released", label: "Date released" },
  { id: "date_added", label: "Date added" },
];

export function sortLibraryBooks(
  books: LibraryBookRow[],
  sort: ShelfSort
): LibraryBookRow[] {
  const copy = [...books];
  switch (sort) {
    case "title":
      return copy.sort((a, b) =>
        (a.books?.title ?? "").localeCompare(b.books?.title ?? "", undefined, {
          sensitivity: "base",
        })
      );
    case "author":
      return copy.sort((a, b) =>
        (a.books?.author ?? "").localeCompare(b.books?.author ?? "", undefined, {
          sensitivity: "base",
        })
      );
    case "date_released":
      return copy.sort((a, b) => {
        const aDate = a.books?.published_date
          ? new Date(a.books.published_date).getTime()
          : 0;
        const bDate = b.books?.published_date
          ? new Date(b.books.published_date).getTime()
          : 0;
        return bDate - aDate;
      });
    case "date_added":
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "recent":
    default:
      return copy.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }
}

// ---- Write actions -----------------------------------------------------------

export async function getUserBook(
  userId: string,
  bookId: string
): Promise<UserBook | null> {
  const { data, error } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserBook | null) ?? null;
}

async function recordBookActivity(
  userId: string,
  eventType: ActivityEventType,
  userBookId: string | null,
  book: { id: string; title: string; cover_url?: string | null; subjects?: string[] | null },
  extra: Record<string, unknown> = {}
) {
  await recordActivity({
    user_id: userId,
    event_type: eventType,
    entity_type: "user_book",
    entity_id: userBookId,
    metadata_json: activityMetadata(book.title, {
      ...bookActivityContext(book),
      ...extra,
    }),
  });
}

/**
 * Add a catalog book to a shelf, or move an existing library row.
 * Prefer the authenticated user's `user_books` record — never fail with
 * "Book not found" for a book already in the library, and never duplicate rows.
 */
export async function setShelfStatus(
  userId: string,
  book: {
    id: string;
    title: string;
    cover_url?: string | null;
    subjects?: string[] | null;
    page_count?: number | null;
    isbn?: string | null;
  },
  shelfStatus: ShelfStatus,
  options?: { manualPageCount?: number | null }
): Promise<{ error?: string }> {
  if (!book.id) {
    return { error: "Book not found." };
  }

  const { data: existing } = await supabase
    .from("user_books")
    .select(
      "id, shelf_status, progress_pages, read_count, started_at, finished_at, is_favorite, rating, completion_tags, dnf"
    )
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .maybeSingle();

  if (existing?.shelf_status === shelfStatus && Boolean(existing.dnf) === (shelfStatus === "dnf")) {
    return {};
  }

  // Catalog metadata is optional when the library row already exists.
  const { data: bookRow } = await supabase
    .from("books")
    .select("id, page_count, cover_url, subjects, isbn")
    .eq("id", book.id)
    .maybeSingle();

  if (!existing && !bookRow && !book.title) {
    return { error: "Book not found." };
  }

  const pageCount = bookRow?.page_count ?? book.page_count ?? null;
  const previousPage = Number(existing?.progress_pages) || 0;
  const previousShelf = existing?.shelf_status ?? null;
  const now = new Date().toISOString();

  if (shelfStatus === "read" && previousShelf !== "read") {
    let userBookId = existing?.id;
    let startedAt = existing?.started_at ?? now;
    let readCount = existing?.read_count;
    let isFavorite = existing?.is_favorite;
    let rating = existing?.rating;
    let completionTags = existing?.completion_tags;

    if (userBookId) {
      if (!existing?.started_at) {
        const { error: startedError } = await supabase
          .from("user_books")
          .update({ started_at: now, updated_at: now })
          .eq("id", userBookId);
        if (startedError) return { error: startedError.message };
        startedAt = now;
      }
    } else {
      const { data: userBook, error } = await supabase
        .from("user_books")
        .upsert(
          {
            user_id: userId,
            book_id: book.id,
            shelf_status: "want_to_read",
            dnf: false,
            updated_at: now,
            started_at: now,
          },
          { onConflict: "user_id,book_id" }
        )
        .select("id, started_at, read_count, is_favorite, rating, completion_tags")
        .single();

      if (error) return { error: error.message };

      userBookId = userBook.id;
      startedAt = userBook.started_at ?? now;
      readCount = userBook.read_count;
      isFavorite = userBook.is_favorite;
      rating = userBook.rating;
      completionTags = userBook.completion_tags;
    }

    if (!userBookId) {
      return { error: "Could not update this book on your shelf." };
    }

    const completion = await completeReadingSession({
      userId,
      bookId: book.id,
      userBookId,
      bookTitle: book.title,
      book: {
        id: book.id,
        page_count: pageCount,
        cover_url: book.cover_url ?? bookRow?.cover_url ?? null,
        subjects: book.subjects ?? bookRow?.subjects ?? null,
        isbn: bookRow?.isbn ?? book.isbn ?? null,
      },
      editionSelected: Boolean(bookRow?.isbn ?? book.isbn),
      previousPage,
      readNumber: Number(readCount) || 1,
      finishedAt: now,
      startedAt,
      manualPageCount: options?.manualPageCount,
      source: Number(readCount) > 1 ? "reread" : "shelf_move",
      applyCompletionTags: Boolean(existing ?? userBookId),
      completionTagsState:
        existing || userBookId
          ? {
              read_count: readCount,
              is_favorite: isFavorite,
              rating,
              completion_tags: completionTags,
            }
          : undefined,
    });

    if (completion.error) return { error: completion.error };
    return {};
  }

  const shelfPatch = buildUserBookShelfPatch({
    shelfStatus,
    existingStartedAt: existing?.started_at,
    now,
  });

  let userBookId: string | null = existing?.id ?? null;

  if (existing?.id) {
    const { data: userBook, error } = await supabase
      .from("user_books")
      .update(shelfPatch)
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error) return { error: error.message };
    userBookId = userBook.id;
  } else {
    const { data: userBook, error } = await supabase
      .from("user_books")
      .upsert(
        {
          user_id: userId,
          book_id: book.id,
          ...shelfPatch,
        },
        { onConflict: "user_id,book_id" }
      )
      .select("id")
      .single();

    if (error) return { error: error.message };
    userBookId = userBook.id;
  }

  const eventType: ActivityEventType = existing ? "shelf_updated" : "book_added";
  await recordBookActivity(userId, eventType, userBookId, book, {
    shelf_status: shelfStatus,
    previous_shelf_status: previousShelf,
  });

  return {};
}

export async function updateReadingProgress(
  userId: string,
  book: { id: string; title: string; cover_url?: string | null; subjects?: string[] | null; page_count?: number | null },
  input: {
    progressPages?: number | null;
    progressPercent: number;
    totalPages?: number | null;
    format?: "book" | "audiobook";
    currentListeningTime?: string;
    totalListeningTime?: string;
    listeningProgressSeconds?: number;
    totalListeningSeconds?: number;
  }
): Promise<{ error?: string }> {
  const isAudiobook = input.format === "audiobook";
  const { data: existing } = await supabase
    .from("user_books")
    .select("id, listening_progress_seconds, progress_pages, read_count")
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .maybeSingle();

  let listeningProgressSeconds = 0;
  let totalListeningSeconds = 0;
  let progressPercent = input.progressPercent;

  if (isAudiobook) {
    const validated = validateListeningProgress({
      current: input.currentListeningTime ?? input.listeningProgressSeconds,
      total: input.totalListeningTime ?? input.totalListeningSeconds,
    });
    if (!validated.ok) return { error: validated.error };
    listeningProgressSeconds = validated.currentSeconds;
    totalListeningSeconds = validated.totalSeconds;
    progressPercent = validated.percent;
  }

  const previousListening = Number(existing?.listening_progress_seconds) || 0;
  const { data: userBook, error } = await supabase
    .from("user_books")
    .update({
      progress_percent: progressPercent,
      ...(isAudiobook
        ? {
            tracking_format: "audiobook",
            listening_progress_seconds: listeningProgressSeconds,
            audiobook_duration_seconds: totalListeningSeconds,
          }
        : {
            tracking_format: "book",
            progress_pages: input.progressPages ?? 0,
            ...(input.totalPages && input.totalPages > 0 ? { total_pages: input.totalPages } : {}),
          }),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (isAudiobook && userBook?.id && listeningProgressSeconds > previousListening) {
    const session = await createReadingSession({
      userId,
      userBookId: userBook.id,
      pageStart: 0,
      pageEnd: 0,
      percentComplete: progressPercent,
      activityKind: "progress",
      readNumber: Number(existing?.read_count) || 1,
      sessionFormat: "audiobook",
      listeningStartSeconds: previousListening,
      listeningEndSeconds: listeningProgressSeconds,
    });
    if (session.error) return { error: session.error };
    if (session.session?.id) {
      void evaluateProgressForChallenges({
        userId,
        userBookId: userBook.id,
        qualifyingEventId: session.session.id,
        qualifyingDate: new Date().toISOString(),
        pagesInEvent: 0,
        listeningSecondsInEvent: listeningProgressSeconds - previousListening,
      });
    }
  } else if (!isAudiobook && userBook?.id) {
    const previousPage = Number(existing?.progress_pages) || 0;
    const nextPage = input.progressPages ?? 0;
    if (nextPage > previousPage) {
      const session = await createReadingSession({
        userId,
        userBookId: userBook.id,
        pageStart: previousPage,
        pageEnd: nextPage,
        percentComplete: progressPercent,
        activityKind: "progress",
        readNumber: Number(existing?.read_count) || 1,
      });
      if (session.error) return { error: session.error };
      if (session.session?.id) {
        void evaluateProgressForChallenges({
          userId,
          userBookId: userBook.id,
          qualifyingEventId: session.session.id,
          qualifyingDate: new Date().toISOString(),
          pagesInEvent: nextPage - previousPage,
          listeningSecondsInEvent: 0,
        });
      }
    }
  }

  await recordBookActivity(userId, "progress_updated", userBook?.id ?? null, book, {
    progress_percent: progressPercent,
    ...(isAudiobook ? { format: "audiobook", listening_seconds: listeningProgressSeconds } : {}),
  });
  return {};
}

export async function logListeningSession(
  userId: string,
  book: {
    id: string;
    title: string;
    cover_url?: string | null;
    subjects?: string[] | null;
    audiobook_duration_seconds?: number | null;
  },
  input: {
    startTime: string;
    endTime: string;
    currentListeningSeconds?: number;
    totalListeningSeconds?: number;
  }
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("user_books")
    .select("id, listening_progress_seconds, audiobook_duration_seconds, read_count, started_at, shelf_status, finished_at")
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .maybeSingle();

  if (!existing) return { error: "Add this book to a shelf before logging a session." };

  const totalSeconds = resolveAudiobookDurationSeconds({
    userDurationSeconds: existing.audiobook_duration_seconds ?? input.totalListeningSeconds,
    catalogDurationSeconds: book.audiobook_duration_seconds,
  });
  const validated = validateListeningSession({
    start: input.startTime,
    end: input.endTime,
    total: totalSeconds > 0 ? totalSeconds : undefined,
  });
  if (!validated.ok) return { error: validated.error };

  const currentSeconds =
    Number(existing.listening_progress_seconds) || input.currentListeningSeconds || 0;
  const nextCurrent = nextListeningProgressAfterSession(currentSeconds, validated.endSeconds);
  const nextPercent = totalSeconds > 0 ? calculateAudiobookProgress(nextCurrent, totalSeconds) : 0;
  const now = new Date().toISOString();

  const session = await createReadingSession({
    userId,
    userBookId: existing.id,
    pageStart: 0,
    pageEnd: 0,
    percentComplete: nextPercent,
    activityKind: "progress",
    readNumber: Number(existing.read_count) || 1,
    sessionFormat: "audiobook",
    listeningStartSeconds: validated.startSeconds,
    listeningEndSeconds: validated.endSeconds,
  });
  if (session.error) return { error: session.error };
  if (session.session?.id) {
    void evaluateProgressForChallenges({
      userId,
      userBookId: existing.id,
      qualifyingEventId: session.session.id,
      qualifyingDate: now,
      pagesInEvent: 0,
      listeningSecondsInEvent: validated.durationSeconds,
    });
  }

  if (nextCurrent !== currentSeconds) {
    const { error } = await supabase
      .from("user_books")
      .update({
        tracking_format: "audiobook",
        listening_progress_seconds: nextCurrent,
        progress_percent: nextPercent,
        started_at: existing.started_at ?? now,
        updated_at: now,
        ...(existing.shelf_status !== "currently_reading" && !existing.finished_at
          ? { shelf_status: "currently_reading" }
          : {}),
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  }

  await recordBookActivity(userId, "progress_updated", existing.id, book, {
    progress_percent: nextPercent,
    format: "audiobook",
    listening_seconds: validated.durationSeconds,
  });
  return {};
}

export async function markFinished(
  userId: string,
  book: {
    id: string;
    title: string;
    cover_url?: string | null;
    subjects?: string[] | null;
    page_count?: number | null;
    isbn?: string | null;
  },
  options?: { finishedAt?: string }
): Promise<{
  error?: string;
  promptReview?: boolean;
  challengeUpdates?: import("../../../../packages/utils/challengeTypes").ChallengeEvaluationSummary;
}> {
  const { data: userBook, error: fetchError } = await supabase
    .from("user_books")
    .select("id, progress_pages, started_at, read_count, is_favorite, rating, completion_tags")
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!userBook) return { error: "Add this book to your library first." };

  const now = new Date().toISOString();
  const finishedRaw = options?.finishedAt?.trim() ?? "";
  const finished_at = finishedRaw
    ? new Date(`${finishedRaw}T12:00:00.000Z`).toISOString()
    : now;

  if (finishedRaw && Number.isNaN(new Date(finishedRaw).getTime())) {
    return { error: "Invalid finish date." };
  }

  if (userBook.started_at && finished_at < userBook.started_at) {
    return { error: "Finish date cannot be before start date." };
  }

  const previousPage = Number(userBook.progress_pages) || 0;

  const completion = await completeReadingSession({
    userId,
    bookId: book.id,
    userBookId: userBook.id,
    bookTitle: book.title,
    book: {
      id: book.id,
      page_count: book.page_count ?? null,
      cover_url: book.cover_url ?? null,
      subjects: book.subjects ?? null,
      isbn: book.isbn ?? null,
    },
    editionSelected: Boolean(book.isbn),
    previousPage,
    readNumber: Number(userBook.read_count) || 1,
    finishedAt: finished_at,
    startedAt: userBook.started_at ?? finished_at,
    source: Number(userBook.read_count) > 1 ? "reread" : "mark_finished",
    applyCompletionTags: true,
    completionTagsState: {
      read_count: userBook.read_count,
      is_favorite: userBook.is_favorite,
      rating: userBook.rating,
      completion_tags: userBook.completion_tags,
    },
  });

  if (completion.error) return { error: completion.error };

  return {
    promptReview: completion.promptReview ?? true,
    challengeUpdates: completion.challengeUpdates,
  };
}

/**
 * Start "another read" of a book (mirrors web `addAnotherRead`). Keeps the same
 * user_books row but bumps `read_count`, resets progress, and moves it back to
 * "currently reading". Past reviews + reading sessions (keyed by read_number)
 * are preserved, so the read history stays intact. Returns the new read number.
 */
export async function addAnotherRead(
  userId: string,
  book: { id: string; title: string; cover_url?: string | null; subjects?: string[] | null }
): Promise<{ error?: string; readNumber?: number }> {
  const { data: userBook, error: fetchError } = await supabase
    .from("user_books")
    .select("id, read_count")
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!userBook) return { error: "Add this book to your library first." };

  const nextReadCount = (Number(userBook.read_count) || 1) + 1;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("user_books")
    .update({
      read_count: nextReadCount,
      shelf_status: "currently_reading",
      progress_pages: 0,
      progress_percent: 0,
      started_at: null,
      finished_at: null,
      dnf: false,
      updated_at: now,
    })
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  await recordBookActivity(userId, "reading_started", userBook.id, book);
  return { readNumber: nextReadCount };
}

/**
 * Mark / unmark Did Not Finish. DNF is a permanent built-in shelf (`shelf_status = dnf`)
 * plus the `dnf` flag. Progress, sessions, notes, and custom-shelf memberships are preserved.
 */
export async function setDnf(
  userId: string,
  bookId: string,
  dnf: boolean
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_books")
    .update(
      dnf
        ? buildUserBookShelfPatch({ shelfStatus: "dnf", now })
        : {
            dnf: false,
            // Leaving DNF returns the book to Currently Reading without wiping history.
            shelf_status: "currently_reading",
            updated_at: now,
          }
    )
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) return { error: error.message };
  return {};
}

/** Save the reader's selected-edition page count — never the shared catalog. */
export async function updateBookTotalPages(
  userId: string,
  bookId: string,
  totalPages: number,
  currentPage = 0
): Promise<{ error?: string }> {
  if (!Number.isInteger(totalPages) || totalPages <= 0) {
    return { error: "Enter a whole number greater than zero." };
  }
  if (!Number.isInteger(currentPage) || currentPage < 0) {
    return { error: "Current page cannot be negative." };
  }
  if (currentPage > totalPages) {
    return { error: "Current page cannot be greater than total pages." };
  }

  const percent = Math.min(100, Math.round((currentPage / totalPages) * 1000) / 10);
  const { error } = await supabase
    .from("user_books")
    .update({
      total_pages: totalPages,
      progress_pages: currentPage,
      progress_percent: percent,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (error) return { error: error.message };
  return {};
}

/**
 * Sets the reader's edition format on user_books. Page and listening history
 * stay as-is — nothing is converted.
 */
export async function updateBookFormat(
  userId: string,
  bookId: string,
  format: "book" | "audiobook"
): Promise<{ error?: string }> {
  const { data: userBook, error: fetchError } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!userBook) return { error: "Add this book to a shelf before choosing a format." };

  const { error } = await supabase
    .from("user_books")
    .update({
      tracking_format: format,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userBook.id);

  if (error) return { error: error.message };
  return {};
}

/** Set (or clear) the reader's target "Date to Read" (expected_read_date). */
export async function setExpectedReadDate(
  userId: string,
  bookId: string,
  expectedReadDate: string | null
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_books")
    .update({
      expected_read_date: expectedReadDate,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) return { error: error.message };
  return {};
}

export async function toggleFavorite(
  userId: string,
  bookId: string,
  isFavorite: boolean
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_books")
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) return { error: error.message };
  return {};
}

/**
 * Fully removes a book from the viewer's built-in shelves (deletes the
 * `user_books` row). Custom shelf memberships live in a separate table
 * (`user_shelf_books`) and are untouched. Mirrors the web
 * `removeFromShelf` action so Library and Search share identical semantics.
 */
export async function removeBookFromShelf(
  userId: string,
  bookId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) return { error: error.message };
  return {};
}

const SHELVED_CATALOG_SOURCES = new Set(["isbndb", "open_library"]);

export type BookShelfMembership = {
  bookId: string;
  shelfStatus: ShelfStatus | null;
  isFavorite: boolean;
};

const CATALOG_MEMBERSHIP_SELECT =
  "book_id, shelf_status, is_favorite, books(id, external_id, external_source, isbn)";

type CatalogMembershipRow = {
  book_id: string;
  shelf_status: ShelfStatus | null;
  is_favorite: boolean | null;
  books:
    | {
        id: string;
        external_id: string | null;
        external_source: string | null;
        isbn: string | null;
      }
    | {
        id: string;
        external_id: string | null;
        external_source: string | null;
        isbn: string | null;
      }[]
    | null;
};

/**
 * Built-in shelf membership for the viewer's catalog books, keyed by every
 * external id / ISBN we recognize for a book. Powers the shelf indicator and
 * add/remove/move actions directly from Search (mirrors the web
 * `getBookShelfMemberships`).
 */
export async function getBookShelfMemberships(
  userId: string
): Promise<Map<string, BookShelfMembership>> {
  const { data, error } = await supabase
    .from("user_books")
    .select(CATALOG_MEMBERSHIP_SELECT)
    .eq("user_id", userId);

  if (error) throw error;

  const memberships = new Map<string, BookShelfMembership>();
  for (const row of (data ?? []) as unknown as CatalogMembershipRow[]) {
    const rawBook = row.books;
    const book = Array.isArray(rawBook) ? rawBook[0] : rawBook;
    if (!book?.external_source || !SHELVED_CATALOG_SOURCES.has(book.external_source)) {
      continue;
    }

    const membership: BookShelfMembership = {
      bookId: book.id,
      shelfStatus: row.shelf_status,
      isFavorite: Boolean(row.is_favorite),
    };

    if (book.external_id) memberships.set(book.external_id, membership);
    if (book.isbn) memberships.set(book.isbn.replace(/[-\s]/g, ""), membership);
  }
  return memberships;
}

/**
 * Move an existing user_books row to a built-in shelf or custom collection.
 * Never deletes/recreates the library row — progress, notes, and reviews stay.
 */
export async function moveUserBookToDestination(
  userId: string,
  book: {
    id: string;
    title: string;
    cover_url?: string | null;
    subjects?: string[] | null;
    page_count?: number | null;
    isbn?: string | null;
  },
  destination: ShelfMoveDestination
): Promise<{ error?: string }> {
  if (destination.kind === "builtin") {
    return setShelfStatus(userId, book, destination.status);
  }
  return addBookToCustomShelf(destination.shelfId, userId, book.id);
}
