import { createClient } from "@/lib/supabase/client";
import {
  activityMetadata,
  bookActivityContext,
  recordActivity,
} from "@/lib/services/activity";
import { createReadingSessionWithClient } from "@/lib/services/readingSessions";
import { getShelfLabel, isShelfStatus } from "@/lib/constants/shelfLabels";
import {
  computeCompletionTags,
  mergeCompletionTags,
} from "@/lib/constants/completionTags";
import { parseHalfStarRating } from "@/lib/utils/ratings";
import type { ReviewRatingMode, ShelfStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BookActionState = {
  error?: string;
  success?: string;
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
        cover_url: string | null;
        subjects: string[] | null;
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
    .select("id, title, page_count, cover_url, subjects")
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

async function applyCompletionTagsForFinish(
  supabase: SupabaseClient,
  userBook: UserBookRow,
  rating?: number | null
): Promise<void> {
  const readCount = Number(userBook.read_count) || 1;
  const tags = computeCompletionTags({
    readCount,
    isFavorite: Boolean(userBook.is_favorite),
    rating: rating ?? userBook.rating ?? null,
  });

  await supabase
    .from("user_books")
    .update({
      completion_tags: mergeCompletionTags(userBook.completion_tags, tags),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userBook.id);
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
  const payload: Record<string, unknown> = {
    user_id: user.id,
    book_id: bookId,
    shelf_status,
    updated_at: now,
  };

  if (shelf_status === "currently_reading" && !userBook?.started_at) {
    payload.started_at = now;
  }
  if (shelf_status === "read") {
    payload.finished_at = userBook?.finished_at ?? now;
    if (!userBook?.started_at) payload.started_at = now;
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
      previous_shelf_status: userBook?.shelf_status ?? null,
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

  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, book, userBook } = ctx;

  if (!userBook) {
    return { error: "Add this book to a shelf before tracking progress." };
  }

  const effectiveTotal = totalPages || book.page_count || 0;

  if (effectiveTotal > 0 && currentPage > effectiveTotal) {
    return { error: "Current page cannot exceed total pages." };
  }

  const progress_percent =
    effectiveTotal > 0
      ? Math.min(100, Math.round((currentPage / effectiveTotal) * 1000) / 10)
      : 0;

  const now = new Date().toISOString();
  const previousPage = Number(userBook.progress_pages) || 0;
  const finalPage =
    effectiveTotal > 0 && currentPage >= effectiveTotal ? effectiveTotal : currentPage;
  const finalPercent =
    effectiveTotal > 0 && currentPage >= effectiveTotal ? 100 : progress_percent;

  const updates: Record<string, unknown> = {
    progress_pages: finalPage,
    progress_percent: finalPercent,
    started_at: userBook.started_at ?? now,
    updated_at: now,
  };

  if (effectiveTotal > 0 && currentPage >= effectiveTotal) {
    updates.shelf_status = "read";
    updates.finished_at = userBook.finished_at ?? now;
  } else if (userBook.shelf_status !== "currently_reading" && currentPage > 0) {
    updates.shelf_status = "currently_reading";
  }

  const { error } = await supabase
    .from("user_books")
    .update(updates)
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  if (effectiveTotal > 0 && book.page_count !== effectiveTotal) {
    await supabase.from("books").update({ page_count: effectiveTotal }).eq("id", bookId);
  }

  if (updates.shelf_status === "read") {
    await applyCompletionTagsForFinish(supabase, userBook);
  }

  const sessionResult = await createReadingSessionWithClient(supabase, {
    userId: user.id,
    userBookId: userBook.id,
    pageStart: previousPage,
    pageEnd: finalPage,
    percentComplete: finalPercent,
    readNumber: Number(userBook.read_count) || 1,
  });

  if (sessionResult.error) return { error: sessionResult.error };

  await recordActivity(supabase, {
    user_id: user.id,
    event_type:
      updates.shelf_status === "read" ? "book_finished" : "progress_updated",
    entity_type: "user_book",
    entity_id: userBook.id,
    metadata_json: activityMetadata(book.title, {
      ...bookActivityContext(book),
      progress_percent: finalPercent,
    }),
  });

  return {
    success:
      updates.shelf_status === "read"
        ? "Book Completed 🎉"
        : "Progress saved",
  };
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

  const total = book.page_count ?? Number(userBook.progress_pages) ?? 0;
  const previousPage = Number(userBook.progress_pages) || 0;
  const finalPage = total > 0 ? total : previousPage;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("user_books")
    .update({
      shelf_status: "read",
      progress_pages: finalPage,
      progress_percent: 100,
      finished_at: now,
      started_at: userBook.started_at ?? now,
      updated_at: now,
    })
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  const sessionResult = await createReadingSessionWithClient(supabase, {
    userId: user.id,
    userBookId: userBook.id,
    pageStart: previousPage,
    pageEnd: finalPage,
    percentComplete: 100,
    readNumber: Number(userBook.read_count) || 1,
  });

  if (sessionResult.error) return { error: sessionResult.error };

  await applyCompletionTagsForFinish(supabase, userBook);

  await recordActivity(supabase, {
    user_id: user.id,
    event_type: "book_finished",
    entity_type: "user_book",
    entity_id: userBook.id,
    metadata_json: activityMetadata(book.title, bookActivityContext(book)),
  });

  return { success: "Book Completed 🎉" };
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
