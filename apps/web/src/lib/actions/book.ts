import { createClient } from "@/lib/supabase/client";
import {
  activityMetadata,
  bookActivityContext,
  recordActivity,
} from "@/lib/services/activity";
import { completeReadingSession } from "@/lib/services/completeReadingSession";
import { trackReadingCompleted } from "@/lib/services/productAnalytics";
import { createReadingSessionWithClient } from "@/lib/services/readingSessions";
import { ensureCatalogBook } from "@/lib/services/books";
import { transferUserBookHistory } from "@/lib/services/transferUserBook";
import { getShelfLabel, isShelfStatus } from "@/lib/constants/shelfLabels";
import { parseHalfStarRating } from "@/lib/utils/ratings";
import { sanitizeRatingEmoji } from "@/lib/constants/reviewEmojis";
import type { ReviewRatingMode, ShelfStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BookActionState = {
  error?: string;
  success?: string;
  bookId?: string;
  /** Set after markBookFinished when the UI should offer a review prompt. */
  promptReview?: boolean;
};

type UserBookRow = {
  id: string;
  shelf_status?: ShelfStatus;
  started_at?: string | null;
  finished_at?: string | null;
  progress_pages?: number;
  is_favorite?: boolean;
  read_count?: number;
  completion_tags?: string[] | null;
  rating?: number | null;
};

type AuthBookContext =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: SupabaseClient;
      user: { id: string };
      book: {
        id: string;
        title: string;
        page_count: number | null;
        format: "book" | "ebook" | "audiobook";
        audiobook_duration_seconds: number | null;
        cover_url: string | null;
        subjects: string[] | null;
        isbn: string | null;
      };
      userBook: UserBookRow | null;
    };

async function getAuthUserBook(bookId: string): Promise<AuthBookContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: book } = await supabase
    .from("books")
    .select("id, title, page_count, format, audiobook_duration_seconds, cover_url, subjects, isbn")
    .eq("id", bookId)
    .maybeSingle();

  if (!book) return { ok: false, error: "Book not found." };

  const { data: userBook } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  return { ok: true, supabase, user, book, userBook: userBook as UserBookRow | null };
}

function parseDateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseFeelings(formData: FormData): string[] {
  return formData
    .getAll("feelings")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function parseRatingMode(raw: string): ReviewRatingMode {
  return raw === "advanced" ? "advanced" : "regular";
}

export async function setBookShelfStatus(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const shelfRaw = String(formData.get("shelf_status") ?? "");
  if (!bookId || !isShelfStatus(shelfRaw)) {
    return { error: "Invalid shelf selection." };
  }
  const shelf_status = shelfRaw as ShelfStatus;

  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, book, userBook } = ctx;

  const now = new Date().toISOString();
  const previousShelf = userBook?.shelf_status ?? null;
  const previousPage = Number(userBook?.progress_pages) || 0;
  const manualPageCountRaw = String(formData.get("manual_page_count") ?? "").trim();
  const manualPageCount = manualPageCountRaw ? Number(manualPageCountRaw) : null;
  const catalogPageCountRaw = String(formData.get("catalog_page_count") ?? "").trim();
  const catalogPageCountHint = catalogPageCountRaw ? Number(catalogPageCountRaw) : null;
  const editionSelected =
    String(formData.get("edition_selected") ?? "") === "true" || Boolean(book.isbn);
  const resolvedPageCount = book.page_count ?? catalogPageCountHint;

  if (shelf_status === "read" && previousShelf !== "read") {
    let userBookId = userBook?.id;
    let startedAt = userBook?.started_at ?? now;
    let readCount = userBook?.read_count;
    let isFavorite = userBook?.is_favorite;
    let rating = userBook?.rating;
    let completionTags = userBook?.completion_tags;

    if (userBookId) {
      if (!userBook?.started_at) {
        const { error: startedError } = await supabase
          .from("user_books")
          .update({ started_at: now, updated_at: now })
          .eq("id", userBookId);
        if (startedError) return { error: startedError.message };
        startedAt = now;
      }
    } else {
      const { data: saved, error: upsertError } = await supabase
        .from("user_books")
        .upsert(
          {
            user_id: user.id,
            book_id: bookId,
            shelf_status: "want_to_read",
            updated_at: now,
            started_at: now,
          },
          { onConflict: "user_id,book_id" }
        )
        .select("id, started_at, read_count, is_favorite, rating, completion_tags")
        .single();

      if (upsertError) return { error: upsertError.message };

      userBookId = saved.id;
      startedAt = saved.started_at ?? now;
      readCount = saved.read_count;
      isFavorite = saved.is_favorite;
      rating = saved.rating;
      completionTags = saved.completion_tags;
    }

    if (!userBookId) {
      return { error: "Could not update this book on your shelf." };
    }

    const completion = await completeReadingSession({
      supabase,
      userId: user.id,
      bookId,
      userBookId,
      bookTitle: book.title,
      book: {
        id: book.id,
        page_count: resolvedPageCount,
        cover_url: book.cover_url,
        subjects: book.subjects,
        isbn: book.isbn,
      },
      editionSelected,
      previousPage,
      readNumber: Number(readCount) || 1,
      finishedAt: now,
      startedAt,
      manualPageCount,
      source: Number(readCount) > 1 ? "reread" : "shelf_move",
      applyCompletionTags: true,
      completionTagsState: {
        read_count: readCount,
        is_favorite: isFavorite,
        rating,
        completion_tags: completionTags,
      },
    });

    if (completion.error) return { error: completion.error };

    if (completion.resolution) {
      trackReadingCompleted({
        source: "shelf_move",
        bookId,
        pageCountStatus: completion.resolution.pageCountStatus,
        pageCountSource: completion.resolution.pageCountSource,
        pagesRead:
          completion.resolution.pageCountStatus === "missing"
            ? null
            : completion.resolution.totalPages,
      });
    }

    const verb = userBook ? "Moved to" : "Added to";
    return {
      success: `${verb} ${getShelfLabel(shelf_status)}`,
      promptReview: completion.promptReview,
    };
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    book_id: bookId,
    shelf_status,
    dnf: shelf_status === "dnf",
    updated_at: now,
  };

  if (shelf_status === "currently_reading" && !userBook?.started_at) {
    payload.started_at = now;
  }

  const { data: saved, error } = await supabase
    .from("user_books")
    .upsert(payload, { onConflict: "user_id,book_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const event_type = userBook ? "shelf_updated" : "book_added";
  await recordActivity(supabase, {
    user_id: user.id,
    event_type,
    entity_type: "user_book",
    entity_id: saved.id,
    metadata_json: activityMetadata(book.title, {
      ...bookActivityContext(book),
      shelf_status,
      previous_shelf_status: previousShelf,
    }),
  });

  const verb = userBook ? "Moved to" : "Added to";
  return { success: `${verb} ${getShelfLabel(shelf_status)}` };
}

export async function updateReadingProgress(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const currentPage = Math.max(0, Number(formData.get("current_page") ?? 0));
  const totalPages = Math.max(0, Number(formData.get("total_pages") ?? 0));
  const isAudiobook = String(formData.get("format") ?? "") === "audiobook";
  const currentListeningSeconds = Math.max(
    0,
    Number(formData.get("current_listening_seconds") ?? 0)
  );
  const totalListeningSeconds = Math.max(
    0,
    Number(formData.get("total_listening_seconds") ?? 0)
  );

  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, book, userBook } = ctx;

  if (!userBook) {
    return { error: "Add this book to a shelf before tracking progress." };
  }

  const effectiveTotal = isAudiobook
    ? totalListeningSeconds || book.audiobook_duration_seconds || 0
    : totalPages || book.page_count || 0;

  // Cap display percent only — never auto-finish from page edits.
  // Keep progress_pages as entered even when total is corrected downward.
  const progress_percent =
    effectiveTotal > 0
      ? Math.min(
          100,
          Math.round(((isAudiobook ? currentListeningSeconds : currentPage) / effectiveTotal) * 1000) /
            10
        )
      : 0;

  const now = new Date().toISOString();
  const previousPage = Number(userBook.progress_pages) || 0;
  const finalPage = currentPage;
  const finalPercent = progress_percent;

  const updates: Record<string, unknown> = {
    ...(isAudiobook
      ? { listening_progress_seconds: currentListeningSeconds }
      : { progress_pages: finalPage }),
    progress_percent: finalPercent,
    started_at: userBook.started_at ?? now,
    updated_at: now,
  };

  // Progress edits never mark finished; only markBookFinished does.
  // Any progress save clears a prior finish so users can recover after an
  // accidental auto-finish (e.g. editing page_count mid-keystroke).
  if (userBook.finished_at || userBook.shelf_status === "read") {
    updates.finished_at = null;
    updates.shelf_status = finalPage > 0 ? "currently_reading" : "want_to_read";
  } else if (
    userBook.shelf_status !== "currently_reading" &&
    (isAudiobook ? currentListeningSeconds : currentPage) > 0
  ) {
    updates.shelf_status = "currently_reading";
  }

  const { error } = await supabase
    .from("user_books")
    .update(updates)
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  if (effectiveTotal > 0) {
    await supabase
      .from("books")
      .update(
        isAudiobook
          ? { format: "audiobook", audiobook_duration_seconds: effectiveTotal }
          : { page_count: effectiveTotal }
      )
      .eq("id", bookId);
  }

  const sessionResult = await createReadingSessionWithClient(supabase, {
    userId: user.id,
    userBookId: userBook.id,
    pageStart: isAudiobook ? 0 : previousPage,
    pageEnd: isAudiobook ? 0 : finalPage,
    percentComplete: finalPercent,
    readNumber: Number(userBook.read_count) || 1,
    ...(isAudiobook
      ? {
          sessionFormat: "audiobook" as const,
          listeningStartSeconds: Number(
            (userBook as UserBookRow & { listening_progress_seconds?: number }).listening_progress_seconds
          ) || 0,
          listeningEndSeconds: currentListeningSeconds,
        }
      : {}),
  });

  if (sessionResult.error) return { error: sessionResult.error };

  await recordActivity(supabase, {
    user_id: user.id,
    event_type: "progress_updated",
    entity_type: "user_book",
    entity_id: userBook.id,
    metadata_json: activityMetadata(book.title, {
      ...bookActivityContext(book),
      progress_percent: finalPercent,
      ...(isAudiobook ? { listening_seconds: currentListeningSeconds, format: "audiobook" } : {}),
    }),
  });

  return { success: "Progress saved" };
}

export async function markBookFinished(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, book, userBook } = ctx;

  if (!userBook) {
    return { error: "Add this book to your library first." };
  }

  const previousPage = Number(userBook.progress_pages) || 0;
  const now = new Date().toISOString();
  const finishedRaw = String(formData.get("finished_at") ?? "").trim();
  const parsedFinish = parseDateInput(finishedRaw);
  const finished_at = parsedFinish ?? now;
  const manualPageCountRaw = String(formData.get("manual_page_count") ?? "").trim();
  const manualPageCount = manualPageCountRaw ? Number(manualPageCountRaw) : null;

  if (finishedRaw && !parsedFinish) {
    return { error: "Invalid finish date." };
  }

  if (userBook.started_at && finished_at < userBook.started_at) {
    return { error: "Finish date cannot be before start date." };
  }

  const completion = await completeReadingSession({
    supabase,
    userId: user.id,
    bookId,
    userBookId: userBook.id,
    bookTitle: book.title,
    book: {
      id: book.id,
      page_count: book.page_count,
      cover_url: book.cover_url,
      subjects: book.subjects,
      isbn: book.isbn,
    },
    previousPage,
    readNumber: Number(userBook.read_count) || 1,
    finishedAt: finished_at,
    startedAt: userBook.started_at ?? finished_at,
    manualPageCount,
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

  if (completion.resolution) {
    trackReadingCompleted({
      source: "mark_finished",
      bookId,
      pageCountStatus: completion.resolution.pageCountStatus,
      pageCountSource: completion.resolution.pageCountSource,
      pagesRead:
        completion.resolution.pageCountStatus === "missing"
          ? null
          : completion.resolution.totalPages,
    });
  }

  return { success: "Book Completed 🎉", promptReview: completion.promptReview ?? true };
}

export async function removeFromShelf(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, book, userBook } = ctx;

  if (!userBook) return { error: "This book is not on your shelves." };

  const { error } = await supabase.from("user_books").delete().eq("id", userBook.id);
  if (error) return { error: error.message };

  await recordActivity(supabase, {
    user_id: user.id,
    event_type: "book_removed",
    entity_type: "user_book",
    entity_id: userBook.id,
    metadata_json: activityMetadata(book.title, bookActivityContext(book)),
  });

  return { success: "Removed from your library." };
}

export async function saveReview(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const reviewId = String(formData.get("review_id") ?? "").trim();
  const rating = parseHalfStarRating(formData.get("rating"));
  const review_body = String(formData.get("review_body") ?? "").trim() || null;
  const has_spoilers = formData.get("has_spoilers") === "on";
  const edition = String(formData.get("edition") ?? "").trim() || null;
  const read_number = Math.max(1, Number(formData.get("read_number") ?? 1) || 1);
  const rating_mode = parseRatingMode(String(formData.get("rating_mode") ?? "regular"));
  const rating_emoji = sanitizeRatingEmoji(String(formData.get("rating_emoji") ?? ""));
  const feelings = parseFeelings(formData);

  const aspectFields = [
    "plot",
    "characters",
    "writing_style",
    "world_building",
    "pacing",
    "emotional_impact",
  ] as const;

  const aspects: Record<string, number | null> = {};
  for (const field of aspectFields) {
    const value = parseHalfStarRating(formData.get(field));
    aspects[field] = rating_mode === "advanced" ? value : null;
  }

  if (!bookId || rating == null) {
    return { error: "Please choose a rating from 0.5 to 5 stars." };
  }

  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, book, userBook } = ctx;

  const payload = {
    user_id: user.id,
    book_id: bookId,
    user_book_id: userBook?.id ?? null,
    read_number,
    rating,
    review_body,
    has_spoilers,
    edition,
    feelings,
    rating_mode,
    rating_emoji,
    visibility: "public" as const,
    updated_at: new Date().toISOString(),
    ...aspects,
  };

  let savedId: string;
  let isUpdate = false;

  if (reviewId) {
    const { data: updated, error } = await supabase
      .from("reviews")
      .update(payload)
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!updated) return { error: "Review not found." };
    savedId = updated.id;
    isUpdate = true;
  } else {
    const { data: inserted, error } = await supabase
      .from("reviews")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "You already have a review for this read. Edit it instead." };
      }
      return { error: error.message };
    }
    savedId = inserted.id;
  }

  if (userBook) {
    await supabase
      .from("user_books")
      .update({ rating, updated_at: new Date().toISOString() })
      .eq("id", userBook.id);
  }

  await recordActivity(supabase, {
    user_id: user.id,
    event_type: isUpdate ? "review_updated" : "review_created",
    entity_type: "review",
    entity_id: savedId,
    metadata_json: activityMetadata(book.title, {
      ...bookActivityContext(book),
      rating,
      read_number,
      ...(rating_emoji ? { rating_emoji } : {}),
    }),
  });

  return { success: isUpdate ? "Review updated." : "Review published." };
}

export async function addAnotherRead(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, book, userBook } = ctx;

  if (!userBook) {
    return { error: "Add this book to your library first." };
  }

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
      updated_at: now,
    })
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  await recordActivity(supabase, {
    user_id: user.id,
    event_type: "reading_started",
    entity_type: "user_book",
    entity_id: userBook.id,
    metadata_json: activityMetadata(book.title, {
      ...bookActivityContext(book),
      read_number: nextReadCount,
    }),
  });

  return { success: `Started read #${nextReadCount}. Your past sessions and reviews are saved.` };
}

export async function toggleFavorite(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, userBook } = ctx;

  if (!userBook) {
    return { error: "Add this book to your library first." };
  }

  const next = !userBook.is_favorite;
  const { error } = await supabase
    .from("user_books")
    .update({ is_favorite: next, updated_at: new Date().toISOString() })
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  return { success: next ? "Added to favorites." : "Removed from favorites." };
}

export async function updateReadingDates(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const startedRaw = String(formData.get("started_at") ?? "");
  const finishedRaw = String(formData.get("finished_at") ?? "");

  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, userBook } = ctx;

  if (!userBook) {
    return { error: "Add this book to a shelf before setting reading dates." };
  }

  const started_at = parseDateInput(startedRaw);
  const finished_at = parseDateInput(finishedRaw);

  if (startedRaw.trim() && !started_at) {
    return { error: "Invalid start date." };
  }
  if (finishedRaw.trim() && !finished_at) {
    return { error: "Invalid finish date." };
  }

  if (started_at && finished_at && finished_at < started_at) {
    return { error: "Finish date cannot be before start date." };
  }

  const { error } = await supabase
    .from("user_books")
    .update({
      started_at,
      finished_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  return { success: "Reading dates updated." };
}

export async function deleteReview(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const reviewId = String(formData.get("review_id") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  return { success: "Review deleted." };
}

/**
 * Transfer progress, sessions, notes, reviews, and shelf membership
 * from the current shelved book onto another catalog edition.
 */
export async function transferReadingStats(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const fromBookId = String(formData.get("from_book_id") ?? "").trim();
  const toBookIdRaw = String(formData.get("to_book_id") ?? "").trim();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!fromBookId) return { error: "Source book is required." };

  const { data: sourceUserBook } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("user_id", user.id)
    .eq("book_id", fromBookId)
    .maybeSingle();

  if (!sourceUserBook) {
    return { error: "Add this book to your library before transferring stats." };
  }

  let toBookId = toBookIdRaw;

  // Catalog search path: upsert target edition first when no catalog book_id yet.
  if (!toBookId) {
    const externalId = String(formData.get("external_id") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    if (!externalId || !title) {
      return { error: "Select a target edition to transfer to." };
    }

    const catalog = await ensureCatalogBook({
      title,
      author: String(formData.get("author") ?? "").trim() || null,
      external_id: externalId,
      cover_url: String(formData.get("cover_url") ?? "").trim() || undefined,
      page_count: String(formData.get("page_count") ?? ""),
      isbn: String(formData.get("isbn") ?? "").trim() || undefined,
      first_publish_year: String(formData.get("first_publish_year") ?? "").trim() || undefined,
      first_sentence: String(formData.get("first_sentence") ?? "").trim() || undefined,
      edition_key: String(formData.get("edition_key") ?? "").trim() || undefined,
    });

    if (catalog.error || !catalog.bookId) {
      return { error: catalog.error ?? "Could not save the target edition." };
    }
    toBookId = catalog.bookId;
  }

  if (toBookId === fromBookId) {
    return { error: "Choose a different edition than the one already on your shelf." };
  }

  const { data: sourceBook } = await supabase
    .from("books")
    .select("id, title, cover_url, subjects")
    .eq("id", fromBookId)
    .maybeSingle();

  const { data: targetBook } = await supabase
    .from("books")
    .select("id, title, cover_url, subjects")
    .eq("id", toBookId)
    .maybeSingle();

  const result = await transferUserBookHistory(
    supabase,
    user.id,
    sourceUserBook.id,
    toBookId
  );

  if (result.error || !result.toBookId) {
    return { error: result.error ?? "Transfer failed." };
  }

  await recordActivity(supabase, {
    user_id: user.id,
    event_type: "shelf_updated",
    entity_type: "user_book",
    entity_id: result.toUserBookId ?? null,
    metadata_json: activityMetadata(targetBook?.title ?? sourceBook?.title ?? "Book", {
      ...bookActivityContext(targetBook ?? sourceBook ?? { id: toBookId }),
      transferred_from_book_id: fromBookId,
      transferred_from_title: sourceBook?.title ?? null,
    }),
  });

  return {
    success: `Moved reading stats to ${targetBook?.title ?? "the selected edition"}.`,
    bookId: result.toBookId,
  };
}
