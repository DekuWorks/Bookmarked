import {
  buildCompletionSessionPatch,
  buildCompletionUserBookPatch,
  resolvePageCount,
  type PageCountResolution,
} from "@/lib/utils/readingCompletion";
import { needsMissingPageCountPrompt } from "@bookmarked/utils/readingCompletion";

export { needsMissingPageCountPrompt };
import {
  activityMetadata,
  bookActivityContext,
  recordActivity,
} from "@/lib/services/activity";
import {
  computeCompletionTags,
  mergeCompletionTags,
} from "@/lib/constants/completionTags";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CompleteReadingSource =
  | "shelf_move"
  | "mark_finished"
  | "search_add"
  | "library"
  | "reread";

export type CompleteReadingSessionInput = {
  supabase: SupabaseClient;
  userId: string;
  bookId: string;
  userBookId: string;
  bookTitle: string;
  book: {
    id: string;
    page_count?: number | null;
    cover_url?: string | null;
    subjects?: string[] | null;
    isbn?: string | null;
  };
  editionSelected?: boolean;
  previousPage?: number;
  readNumber?: number;
  finishedAt?: string;
  startedAt?: string | null;
  manualPageCount?: number | null;
  source: CompleteReadingSource;
  sessionId?: string | null;
  applyCompletionTags?: boolean;
  completionTagsState?: {
    read_count?: number | null;
    is_favorite?: boolean | null;
    rating?: number | null;
    completion_tags?: string[] | null;
  };
};

export type CompleteReadingSessionResult = {
  error?: string;
  resolution?: PageCountResolution;
  sessionId?: string;
  promptReview?: boolean;
  pageCountPending?: boolean;
};

async function applyCompletionTags(
  supabase: SupabaseClient,
  userBookId: string,
  state: NonNullable<CompleteReadingSessionInput["completionTagsState"]>
): Promise<void> {
  const readCount = Number(state.read_count) || 1;
  const tags = computeCompletionTags({
    readCount,
    isFavorite: Boolean(state.is_favorite),
    rating: state.rating ?? null,
  });

  await supabase
    .from("user_books")
    .update({
      completion_tags: mergeCompletionTags(state.completion_tags, tags),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userBookId);
}

export async function completeReadingSession(
  input: CompleteReadingSessionInput
): Promise<CompleteReadingSessionResult> {
  const {
    supabase,
    userId,
    bookId,
    userBookId,
    bookTitle,
    book,
    editionSelected = Boolean(book.isbn),
    previousPage = 0,
    readNumber = 1,
    source,
    sessionId,
    applyCompletionTags: shouldApplyTags = true,
    completionTagsState,
  } = input;

  const now = new Date().toISOString();
  const finishedAt = input.finishedAt ?? now;

  const resolution = resolvePageCount({
    editionPageCount: editionSelected ? book.page_count : null,
    editionSelected,
    catalogPageCount: book.page_count,
    previousPage,
    manualPageCount: input.manualPageCount,
  });

  const userBookPatch = buildCompletionUserBookPatch({
    finishedAt,
    startedAt: input.startedAt,
    previousPage,
    resolution,
  });

  const { error: userBookError } = await supabase
    .from("user_books")
    .update({
      ...userBookPatch,
      dnf: false,
      updated_at: now,
    })
    .eq("id", userBookId);

  if (userBookError) return { error: userBookError.message };

  const sessionPatch = buildCompletionSessionPatch({
    previousPage,
    resolution,
    editionId: bookId,
    finishedAt,
  });

  let savedSessionId = sessionId ?? undefined;

  if (sessionId) {
    const { error: sessionError } = await supabase
      .from("reading_sessions")
      .update({ ...sessionPatch, note: null })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (sessionError) return { error: sessionError.message };
  } else {
    const { data: sessionRow, error: sessionError } = await supabase
      .from("reading_sessions")
      .insert({
        user_id: userId,
        user_book_id: userBookId,
        read_number: readNumber,
        created_at: finishedAt,
        ...sessionPatch,
      })
      .select("id")
      .single();

    if (sessionError) return { error: sessionError.message };
    savedSessionId = sessionRow?.id;
  }

  if (shouldApplyTags && completionTagsState) {
    await applyCompletionTags(supabase, userBookId, completionTagsState);
  }

  const pageCountPending = resolution.pageCountStatus === "missing";

  await recordActivity(supabase, {
    user_id: userId,
    event_type: "book_finished",
    entity_type: "user_book",
    entity_id: userBookId,
    metadata_json: activityMetadata(bookTitle, {
      ...bookActivityContext(book),
      shelf_status: "read",
      completion_source: source,
      page_count_pending: pageCountPending,
      pages_read: pageCountPending ? null : sessionPatch.pages_read,
      total_pages: pageCountPending ? null : sessionPatch.total_pages,
      page_count_status: resolution.pageCountStatus,
      page_count_source: resolution.pageCountSource,
      finished_at: finishedAt,
    }),
  });

  return {
    resolution,
    sessionId: savedSessionId,
    promptReview: true,
    pageCountPending,
  };
}

