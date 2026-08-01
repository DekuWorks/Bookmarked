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
import type { ShelfStatus, UserBook } from "../types";

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
  } | null;
};

export type ShelfGroup = {
  status: ShelfStatus;
  title: string;
  slug: string;
  items: LibraryBookRow[];
};

const LIBRARY_SELECT =
  "id, shelf_status, progress_percent, progress_pages, rating, is_favorite, finished_at, started_at, completion_tags, dnf, expected_read_date, created_at, updated_at, books(id, title, author, cover_url, page_count, published_date, subjects)";

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

/** Add a shared `books` row to a shelf (or move it), recording activity. */
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
  const { data: existing } = await supabase
    .from("user_books")
    .select(
      "id, shelf_status, progress_pages, read_count, started_at, finished_at, is_favorite, rating, completion_tags"
    )
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .maybeSingle();

  if (existing?.shelf_status === shelfStatus) return {};

  const { data: bookRow } = await supabase
    .from("books")
    .select("page_count, cover_url, subjects, isbn")
    .eq("id", book.id)
    .maybeSingle();

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
        isbn: bookRow?.isbn ?? null,
      },
      editionSelected: Boolean(bookRow?.isbn),
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

  const patch: Record<string, unknown> = {
    user_id: userId,
    book_id: book.id,
    shelf_status: shelfStatus,
    updated_at: now,
  };
  if (shelfStatus === "currently_reading") patch.started_at = existing?.started_at ?? now;

  const { data: userBook, error } = await supabase
    .from("user_books")
    .upsert(patch, { onConflict: "user_id,book_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const eventType: ActivityEventType = existing ? "shelf_updated" : "book_added";
  await recordBookActivity(userId, eventType, userBook?.id ?? null, book, {
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
    format?: "book" | "audiobook";
    listeningProgressSeconds?: number;
    totalListeningSeconds?: number;
  }
): Promise<{ error?: string }> {
  const isAudiobook = input.format === "audiobook";
  const { data: existing } = await supabase
    .from("user_books")
    .select("id, listening_progress_seconds, read_count")
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .maybeSingle();
  const effectiveTotal = input.totalListeningSeconds ?? 0;
  const listeningProgressSeconds = Math.max(0, input.listeningProgressSeconds ?? 0);
  const progressPercent =
    isAudiobook && effectiveTotal > 0
      ? Math.min(100, Math.round((listeningProgressSeconds / effectiveTotal) * 1000) / 10)
      : input.progressPercent;
  const { data: userBook, error } = await supabase
    .from("user_books")
    .update({
      progress_percent: progressPercent,
      ...(isAudiobook
        ? { listening_progress_seconds: listeningProgressSeconds }
        : { progress_pages: input.progressPages ?? 0 }),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (isAudiobook && effectiveTotal > 0) {
    await supabase
      .from("books")
      .update({ format: "audiobook", audiobook_duration_seconds: effectiveTotal })
      .eq("id", book.id);
  }

  if (isAudiobook && userBook?.id) {
    const session = await createReadingSession({
      userId,
      userBookId: userBook.id,
      pageStart: 0,
      pageEnd: 0,
      percentComplete: progressPercent,
      readNumber: Number(existing?.read_count) || 1,
      sessionFormat: "audiobook",
      listeningStartSeconds: Number(existing?.listening_progress_seconds) || 0,
      listeningEndSeconds: listeningProgressSeconds,
    });
    if (session.error) return { error: session.error };
  }

  await recordBookActivity(userId, "progress_updated", userBook?.id ?? null, book, {
    progress_percent: progressPercent,
    ...(isAudiobook ? { format: "audiobook", listening_seconds: listeningProgressSeconds } : {}),
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
): Promise<{ error?: string; promptReview?: boolean }> {
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

  return { promptReview: completion.promptReview ?? true };
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
 * Mark / unmark a book as did-not-finish. DNF is a real column on user_books
 * (see migration 20260713170538); it is orthogonal to shelf_status so a reader
 * can DNF a book that's still on their "reading" shelf.
 */
export async function setDnf(
  userId: string,
  bookId: string,
  dnf: boolean
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_books")
    .update({
      dnf,
      // DNF is a built-in shelf. Moving a book here must clear the reading
      // state, even when the book is also saved to one or more custom shelves.
      ...(dnf ? { shelf_status: "dnf", progress_percent: 0 } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) return { error: error.message };
  return {};
}

/** Enrich the shared catalog page count from the native book-detail flow. */
export async function updateBookTotalPages(
  bookId: string,
  totalPages: number
): Promise<{ error?: string }> {
  if (!Number.isInteger(totalPages) || totalPages <= 0) {
    return { error: "Enter a whole number greater than zero." };
  }

  const { error } = await supabase
    .from("books")
    .update({ page_count: totalPages, updated_at: new Date().toISOString() })
    .eq("id", bookId);

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
