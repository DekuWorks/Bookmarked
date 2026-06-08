"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { activityMetadata, recordActivity } from "@/lib/services/activity";
import { getShelfLabel, isShelfStatus } from "@/lib/constants/shelfLabels";
import type { ShelfStatus } from "@/types";

export type BookActionState = {
  error?: string;
  success?: string;
};

function revalidateBookPaths(bookId: string) {
  revalidatePath(`/book/${bookId}`);
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/library");
  revalidatePath("/library/want-to-read");
  revalidatePath("/library/reading");
  revalidatePath("/library/read");
  revalidatePath("/dashboard", "page");
}

type UserBookRow = {
  id: string;
  shelf_status?: ShelfStatus;
  started_at?: string | null;
  finished_at?: string | null;
  progress_pages?: number;
  is_favorite?: boolean;
};

type AuthBookContext =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      user: { id: string };
      book: { id: string; title: string; page_count: number | null };
      userBook: UserBookRow | null;
    };

async function getAuthUserBook(bookId: string): Promise<AuthBookContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: book } = await supabase
    .from("books")
    .select("id, title, page_count")
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
      shelf_status,
      previous_shelf_status: userBook?.shelf_status ?? null,
    }),
  });

  revalidateBookPaths(bookId);
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
  const updates: Record<string, unknown> = {
    progress_pages: currentPage,
    progress_percent,
    started_at: userBook.started_at ?? now,
    updated_at: now,
  };

  if (effectiveTotal > 0 && currentPage >= effectiveTotal) {
    updates.shelf_status = "read";
    updates.finished_at = userBook.finished_at ?? now;
    updates.progress_percent = 100;
    updates.progress_pages = effectiveTotal;
  }

  const { error } = await supabase
    .from("user_books")
    .update(updates)
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  if (effectiveTotal > 0 && book.page_count !== effectiveTotal) {
    await supabase.from("books").update({ page_count: effectiveTotal }).eq("id", bookId);
  }

  await recordActivity(supabase, {
    user_id: user.id,
    event_type:
      updates.shelf_status === "read" ? "book_finished" : "progress_updated",
    entity_type: "user_book",
    entity_id: userBook.id,
    metadata_json: activityMetadata(book.title, { progress_percent }),
  });

  revalidateBookPaths(bookId);
  return {
    success:
      updates.shelf_status === "read"
        ? "Marked as finished!"
        : `${progress_percent}% complete`,
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
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("user_books")
    .update({
      shelf_status: "read",
      progress_pages: total > 0 ? total : userBook.progress_pages,
      progress_percent: 100,
      finished_at: now,
      started_at: userBook.started_at ?? now,
      updated_at: now,
    })
    .eq("id", userBook.id);

  if (error) return { error: error.message };

  await recordActivity(supabase, {
    user_id: user.id,
    event_type: "book_finished",
    entity_type: "user_book",
    entity_id: userBook.id,
    metadata_json: activityMetadata(book.title),
  });

  revalidateBookPaths(bookId);
  return { success: "Marked as finished!" };
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
    metadata_json: activityMetadata(book.title),
  });

  revalidateBookPaths(bookId);
  return { success: "Removed from your library." };
}

export async function saveReview(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const bookId = String(formData.get("book_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const review_body = String(formData.get("review_body") ?? "").trim() || null;
  const has_spoilers = formData.get("has_spoilers") === "on";

  if (!bookId || rating < 1 || rating > 5) {
    return { error: "Please choose a rating from 1 to 5 stars." };
  }

  const ctx = await getAuthUserBook(bookId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, book } = ctx;

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    book_id: bookId,
    rating,
    review_body,
    has_spoilers,
    visibility: "public" as const,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabase
    .from("reviews")
    .upsert(payload, { onConflict: "user_id,book_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await recordActivity(supabase, {
    user_id: user.id,
    event_type: existing ? "review_updated" : "review_created",
    entity_type: "review",
    entity_id: saved.id,
    metadata_json: activityMetadata(book.title, { rating }),
  });

  revalidateBookPaths(bookId);
  return { success: existing ? "Review updated." : "Review published." };
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

  revalidateBookPaths(bookId);
  revalidatePath("/reading-room", "page");
  return { success: next ? "Added to favorites." : "Removed from favorites." };
}

export async function deleteReview(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const reviewId = String(formData.get("review_id") ?? "");
  const bookId = String(formData.get("book_id") ?? "");

  const supabase = await createClient();
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

  if (bookId) revalidateBookPaths(bookId);
  return { success: "Review deleted." };
}
