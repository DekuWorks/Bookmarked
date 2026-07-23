import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserBookWithProgress = {
  id: string;
  user_id: string;
  progress_pages: number | null;
  progress_percent: number | null;
  shelf_status: string;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
};

/**
 * Creates a single synthetic session for user_books that have progress but no sessions.
 * Safe to call on load — skips books that already have sessions.
 * Skips read books with zero pages (missing page count) to avoid invalid completions.
 */
export async function backfillReadingSessionsForUser(
  userId: string,
  supabase?: SupabaseClient
): Promise<{ created: number }> {
  const client = supabase ?? createClient();

  const { data: userBooks, error: booksError } = await client
    .from("user_books")
    .select("id, user_id, progress_pages, progress_percent, shelf_status, started_at, finished_at, updated_at")
    .eq("user_id", userId)
    .or("progress_pages.gt.0,progress_percent.gt.0,shelf_status.eq.read");

  if (booksError) {
    console.error("[readingSessionBackfill] fetch user_books failed:", booksError);
    return { created: 0 };
  }

  const candidates = (userBooks ?? []) as UserBookWithProgress[];
  if (!candidates.length) return { created: 0 };

  const userBookIds = candidates.map((b) => b.id);

  const { data: existingSessions, error: sessionsError } = await client
    .from("reading_sessions")
    .select("user_book_id")
    .in("user_book_id", userBookIds);

  if (sessionsError) {
    console.error("[readingSessionBackfill] fetch sessions failed:", sessionsError);
    return { created: 0 };
  }

  const hasSession = new Set((existingSessions ?? []).map((s) => s.user_book_id));
  let created = 0;

  for (const book of candidates) {
    if (hasSession.has(book.id)) continue;

    const pageEnd = Math.max(0, book.progress_pages ?? 0);
    const percent = Math.min(100, Math.max(0, Number(book.progress_percent ?? 0)));

    if (book.shelf_status === "read" && pageEnd <= 0) {
      continue;
    }

    if (pageEnd <= 0 && percent <= 0 && book.shelf_status !== "read") continue;

    const createdAt =
      book.finished_at ?? book.started_at ?? book.updated_at ?? new Date().toISOString();

    const { error } = await client.from("reading_sessions").insert({
      user_id: book.user_id,
      user_book_id: book.id,
      page_start: 0,
      page_end: pageEnd > 0 ? pageEnd : 0,
      pages_read: pageEnd > 0 ? pageEnd : 0,
      percent_complete: book.shelf_status === "read" ? 100 : percent,
      total_pages: pageEnd > 0 ? pageEnd : null,
      page_count_status: pageEnd > 0 ? "known" : book.shelf_status === "read" ? "missing" : null,
      page_count_source: pageEnd > 0 ? "canonical_book" : book.shelf_status === "read" ? "unavailable" : null,
      completed_at: book.shelf_status === "read" ? createdAt : null,
      created_at: createdAt,
    });

    if (error) {
      console.warn("[readingSessionBackfill] create failed:", book.id, error);
      continue;
    }

    created += 1;
  }

  return { created };
}
