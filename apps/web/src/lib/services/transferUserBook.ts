import { mergeCompletionTags } from "@/lib/constants/completionTags";
import type { ShelfStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TransferUserBookResult = {
  toBookId?: string;
  toUserBookId?: string;
  error?: string;
};

type UserBookRow = {
  id: string;
  user_id: string;
  book_id: string;
  shelf_status: ShelfStatus;
  progress_pages: number;
  progress_percent: number;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  is_favorite: boolean;
  read_count: number;
  completion_tags: string[] | null;
};

function shelfPriority(status: ShelfStatus): number {
  switch (status) {
    case "currently_reading":
      return 3;
    case "read":
      return 2;
    case "want_to_read":
      return 1;
    default:
      return 0;
  }
}

function mergeShelfStatus(source: ShelfStatus, target: ShelfStatus): ShelfStatus {
  return shelfPriority(source) >= shelfPriority(target) ? source : target;
}

async function reassignChildRows(
  supabase: SupabaseClient,
  userId: string,
  fromUserBookId: string,
  fromBookId: string,
  toUserBookId: string,
  toBookId: string
): Promise<string | null> {
  const { error: sessionsError } = await supabase
    .from("reading_sessions")
    .update({ user_book_id: toUserBookId })
    .eq("user_id", userId)
    .eq("user_book_id", fromUserBookId);

  if (sessionsError) return sessionsError.message;

  const { error: notesError } = await supabase
    .from("reading_notes")
    .update({ user_book_id: toUserBookId })
    .eq("user_id", userId)
    .eq("user_book_id", fromUserBookId);

  if (notesError) return notesError.message;

  const { data: fromReviews, error: fromReviewsError } = await supabase
    .from("reviews")
    .select("id, read_number")
    .eq("user_id", userId)
    .or(`user_book_id.eq.${fromUserBookId},book_id.eq.${fromBookId}`);

  if (fromReviewsError) return fromReviewsError.message;

  const reviewsToMove = fromReviews ?? [];
  if (reviewsToMove.length === 0) return null;

  const readNumbers = [...new Set(reviewsToMove.map((r) => Number(r.read_number) || 1))];
  const movingIds = new Set(reviewsToMove.map((r) => r.id));

  const { data: conflicting, error: conflictError } = await supabase
    .from("reviews")
    .select("id, read_number")
    .eq("user_id", userId)
    .eq("book_id", toBookId)
    .in("read_number", readNumbers);

  if (conflictError) return conflictError.message;

  const conflictIds = (conflicting ?? [])
    .filter((row) => !movingIds.has(row.id))
    .map((row) => row.id);

  if (conflictIds.length > 0) {
    const { error: deleteConflictError } = await supabase
      .from("reviews")
      .delete()
      .eq("user_id", userId)
      .in("id", conflictIds);
    if (deleteConflictError) return deleteConflictError.message;
  }

  const { error: reviewsError } = await supabase
    .from("reviews")
    .update({
      book_id: toBookId,
      user_book_id: toUserBookId,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in(
      "id",
      reviewsToMove.map((r) => r.id)
    );

  if (reviewsError) return reviewsError.message;
  return null;
}

async function moveCustomShelfMemberships(
  supabase: SupabaseClient,
  userId: string,
  fromBookId: string,
  toBookId: string
): Promise<string | null> {
  if (fromBookId === toBookId) return null;

  const { data: memberships, error } = await supabase
    .from("user_shelf_books")
    .select("id, shelf_id")
    .eq("user_id", userId)
    .eq("book_id", fromBookId);

  if (error) return error.message;
  if (!memberships?.length) return null;

  for (const membership of memberships) {
    const { data: existing } = await supabase
      .from("user_shelf_books")
      .select("id")
      .eq("shelf_id", membership.shelf_id)
      .eq("book_id", toBookId)
      .maybeSingle();

    // No UPDATE policy on user_shelf_books — delete + insert instead.
    const { error: deleteError } = await supabase
      .from("user_shelf_books")
      .delete()
      .eq("id", membership.id)
      .eq("user_id", userId);
    if (deleteError) return deleteError.message;

    if (!existing?.id) {
      const { error: insertError } = await supabase.from("user_shelf_books").insert({
        shelf_id: membership.shelf_id,
        user_id: userId,
        book_id: toBookId,
      });
      if (insertError) return insertError.message;
    }
  }

  return null;
}

/**
 * Move reading history from one shelved book onto another catalog edition.
 * Merges into an existing target shelf entry when present; otherwise creates one.
 * Source user_book is removed after a successful transfer.
 */
export async function transferUserBookHistory(
  supabase: SupabaseClient,
  userId: string,
  fromUserBookId: string,
  toBookId: string
): Promise<TransferUserBookResult> {
  const { data: source, error: sourceError } = await supabase
    .from("user_books")
    .select("*")
    .eq("id", fromUserBookId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sourceError) return { error: sourceError.message };
  if (!source) return { error: "Source book is not on your shelf." };

  const from = source as UserBookRow;

  if (from.book_id === toBookId) {
    return { error: "Choose a different edition than the one already on your shelf." };
  }

  const { data: targetBook, error: targetBookError } = await supabase
    .from("books")
    .select("id, title")
    .eq("id", toBookId)
    .maybeSingle();

  if (targetBookError) return { error: targetBookError.message };
  if (!targetBook) return { error: "Target book not found." };

  const { data: existingTarget, error: targetLookupError } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", toBookId)
    .maybeSingle();

  if (targetLookupError) return { error: targetLookupError.message };

  const now = new Date().toISOString();
  let toUserBookId: string;

  if (existingTarget) {
    const target = existingTarget as UserBookRow;
    toUserBookId = target.id;

    const sourceHasProgress =
      (Number(from.progress_pages) || 0) > 0 ||
      Boolean(from.started_at) ||
      Boolean(from.finished_at) ||
      from.shelf_status === "currently_reading" ||
      from.shelf_status === "read";

    const merged = {
      shelf_status: sourceHasProgress
        ? from.shelf_status
        : mergeShelfStatus(from.shelf_status, target.shelf_status),
      progress_pages: sourceHasProgress
        ? Number(from.progress_pages) || 0
        : Math.max(Number(from.progress_pages) || 0, Number(target.progress_pages) || 0),
      progress_percent: sourceHasProgress
        ? Number(from.progress_percent) || 0
        : Math.max(
            Number(from.progress_percent) || 0,
            Number(target.progress_percent) || 0
          ),
      started_at: from.started_at ?? target.started_at,
      finished_at: from.finished_at ?? target.finished_at,
      rating: from.rating ?? target.rating,
      is_favorite: Boolean(from.is_favorite || target.is_favorite),
      read_count: Math.max(Number(from.read_count) || 1, Number(target.read_count) || 1),
      completion_tags: mergeCompletionTags(target.completion_tags, from.completion_tags ?? []),
      updated_at: now,
    };

    const { error: mergeError } = await supabase
      .from("user_books")
      .update(merged)
      .eq("id", toUserBookId)
      .eq("user_id", userId);

    if (mergeError) return { error: mergeError.message };
  } else {
    const { data: created, error: createError } = await supabase
      .from("user_books")
      .insert({
        user_id: userId,
        book_id: toBookId,
        shelf_status: from.shelf_status,
        progress_pages: from.progress_pages,
        progress_percent: from.progress_percent,
        started_at: from.started_at,
        finished_at: from.finished_at,
        rating: from.rating,
        is_favorite: from.is_favorite,
        read_count: from.read_count,
        completion_tags: from.completion_tags ?? [],
        updated_at: now,
      })
      .select("id")
      .single();

    if (createError || !created) {
      return { error: createError?.message ?? "Could not create target shelf entry." };
    }

    toUserBookId = created.id;
  }

  const childError = await reassignChildRows(
    supabase,
    userId,
    from.id,
    from.book_id,
    toUserBookId,
    toBookId
  );
  if (childError) return { error: childError };

  const shelfError = await moveCustomShelfMemberships(
    supabase,
    userId,
    from.book_id,
    toBookId
  );
  if (shelfError) return { error: shelfError };

  const { error: deleteError } = await supabase
    .from("user_books")
    .delete()
    .eq("id", from.id)
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  return { toBookId, toUserBookId };
}
