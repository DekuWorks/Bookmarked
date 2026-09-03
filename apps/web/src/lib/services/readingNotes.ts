import { createClient } from "@/lib/supabase/client";
import {
  ENTITLEMENT_LIMIT_MESSAGES,
  canSaveQuote,
  toSubscriptionAccessFromRow,
} from "@/lib/utils/subscription";
import {
  NOTES_BOOK_FILTER_COPY,
  buildNotesBookFilterOptions,
  type NotesBookFilterOption,
} from "@bookmarked/utils/notesBookFilter";
import type {
  ReadingNote,
  ReadingNoteCategory,
  ReadingNoteVisibility,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

function countsTowardSavedQuotes(input: {
  quote?: string | null;
  category?: ReadingNoteCategory;
}): boolean {
  return Boolean(normalizeText(input.quote)) || input.category === "favorite_quote";
}

export type ReadingNoteInput = {
  userBookId: string;
  pageNumber?: number | null;
  chapter?: string | null;
  title?: string | null;
  note?: string | null;
  quote?: string | null;
  category: ReadingNoteCategory;
  visibility?: ReadingNoteVisibility;
};

export type ReadingNoteSearchFilters = {
  userId?: string;
  bookId?: string;
  userBookId?: string;
  category?: ReadingNoteCategory;
  pageNumber?: number;
  keyword?: string;
  limit?: number;
  offset?: number;
};

function normalizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRowPayload(userId: string, input: ReadingNoteInput) {
  return {
    user_id: userId,
    user_book_id: input.userBookId,
    page_number: input.pageNumber ?? null,
    chapter: normalizeText(input.chapter),
    title: normalizeText(input.title),
    note: normalizeText(input.note),
    quote: normalizeText(input.quote),
    category: input.category,
    visibility: input.visibility ?? "private",
  };
}

export async function createReadingNote(
  userId: string,
  input: ReadingNoteInput
): Promise<{ error?: string; note?: ReadingNote }> {
  const supabase = createClient();
  const payload = toRowPayload(userId, input);

  if (!payload.note && !payload.quote) {
    return { error: "Add a quote or a note." };
  }

  if (countsTowardSavedQuotes(payload)) {
    const [{ count, error: countError }, { data: subscription }] = await Promise.all([
      supabase
        .from("reading_notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .or("quote.not.is.null,category.eq.favorite_quote"),
      supabase
        .from("user_subscriptions")
        .select("subscription_tier, subscription_status, subscription_expires_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (countError) return { error: countError.message };

    if (!canSaveQuote(count ?? 0, toSubscriptionAccessFromRow(subscription))) {
      return { error: ENTITLEMENT_LIMIT_MESSAGES.saved_quotes };
    }
  }

  const { data, error } = await supabase
    .from("reading_notes")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { note: data as ReadingNote };
}

export async function updateReadingNote(
  noteId: string,
  input: Partial<ReadingNoteInput>
): Promise<{ error?: string; note?: ReadingNote }> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {};
  if (input.pageNumber !== undefined) updates.page_number = input.pageNumber;
  if (input.chapter !== undefined) updates.chapter = normalizeText(input.chapter);
  if (input.title !== undefined) updates.title = normalizeText(input.title);
  if (input.note !== undefined) updates.note = normalizeText(input.note);
  if (input.quote !== undefined) updates.quote = normalizeText(input.quote);
  if (input.category !== undefined) updates.category = input.category;
  if (input.visibility !== undefined) updates.visibility = input.visibility;

  const { data, error } = await supabase
    .from("reading_notes")
    .update(updates)
    .eq("id", noteId)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { note: data as ReadingNote };
}

export async function deleteReadingNote(
  noteId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("reading_notes").delete().eq("id", noteId);
  if (error) return { error: error.message };
  return {};
}

export async function listNotesByBook(
  userBookId: string
): Promise<ReadingNote[]> {
  return listNotes({ userBookId });
}

export async function listNotes(
  filters: ReadingNoteSearchFilters = {}
): Promise<ReadingNote[]> {
  const supabase = createClient();

  let query = supabase
    .from("reading_notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.userBookId) {
    query = query.eq("user_book_id", filters.userBookId);
  }

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.pageNumber != null) {
    query = query.eq("page_number", filters.pageNumber);
  }

  if (filters.limit != null) {
    query = query.limit(filters.limit);
  }

  if (filters.offset != null) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[readingNotes] list failed:", error);
    return [];
  }

  let notes = (data ?? []) as ReadingNote[];

  if (filters.bookId) {
    const bookScoped = await filterNotesByBookId(supabase, notes, filters.bookId);
    notes = bookScoped;
  }

  return notes;
}

async function filterNotesByBookId(
  supabase: SupabaseClient,
  notes: ReadingNote[],
  bookId: string
): Promise<ReadingNote[]> {
  if (notes.length === 0) return notes;

  const userBookIds = [...new Set(notes.map((note) => note.user_book_id))];
  const { data, error } = await supabase
    .from("user_books")
    .select("id, book_id")
    .in("id", userBookIds)
    .eq("book_id", bookId);

  if (error) {
    console.error("[readingNotes] book filter failed:", error);
    return [];
  }

  const allowed = new Set((data ?? []).map((row) => row.id));
  return notes.filter((note) => allowed.has(note.user_book_id));
}

type SearchNotesResult = { notes: ReadingNote[]; error?: string };

async function executeSearchNotes(
  filters: ReadingNoteSearchFilters
): Promise<SearchNotesResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("search_reading_notes", {
    p_user_id: filters.userId ?? null,
    p_book_id: filters.bookId ?? null,
    p_user_book_id: filters.userBookId ?? null,
    p_category: filters.category ?? null,
    p_page_number: filters.pageNumber ?? null,
    p_keyword: filters.keyword ?? null,
    p_limit: filters.limit ?? 50,
    p_offset: filters.offset ?? 0,
  });

  if (error) {
    console.error("[readingNotes] search failed:", error);
    return { notes: await listNotes(filters), error: error.message };
  }

  return { notes: (data ?? []) as ReadingNote[] };
}

/** Search prep — uses RPC with GIN full-text index when keyword is provided. */
export async function searchNotes(
  filters: ReadingNoteSearchFilters = {}
): Promise<ReadingNote[]> {
  const { notes } = await executeSearchNotes(filters);
  return notes;
}

export async function searchNotesWithBooks(
  filters: ReadingNoteSearchFilters = {}
): Promise<{ notes: ReadingNoteWithBook[]; error?: string }> {
  const { notes, error } = await executeSearchNotes(filters);
  return { notes: await enrichNotesWithBooks(notes), error };
}

export type ReadingNoteBookSummary = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
};

export type ReadingNoteWithBook = ReadingNote & {
  book: ReadingNoteBookSummary | null;
};

function resolveBookSummary(book: unknown): ReadingNoteBookSummary | null {
  const resolved = Array.isArray(book) ? book[0] : book;
  if (!resolved || typeof resolved !== "object") return null;
  const row = resolved as {
    id?: unknown;
    title?: unknown;
    author?: unknown;
    cover_url?: unknown;
  };
  if (typeof row.id !== "string" || !row.id) return null;
  return {
    id: row.id,
    title: typeof row.title === "string" ? row.title : "Untitled",
    author: typeof row.author === "string" ? row.author : null,
    cover_url: typeof row.cover_url === "string" ? row.cover_url : null,
  };
}

async function loadBooksByUserBookIds(
  supabase: SupabaseClient,
  userBookIds: string[],
  ownerUserId?: string
): Promise<Map<string, ReadingNoteBookSummary> | null> {
  if (userBookIds.length === 0) return new Map();

  let query = supabase
    .from("user_books")
    .select("id, book_id, books(id, title, author, cover_url)")
    .in("id", userBookIds);

  if (ownerUserId) {
    query = query.eq("user_id", ownerUserId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[readingNotes] load books failed:", error);
    return null;
  }

  const bookByUserBookId = new Map<string, ReadingNoteBookSummary>();
  for (const row of data ?? []) {
    const summary = resolveBookSummary(row.books);
    if (!summary) continue;
    bookByUserBookId.set(row.id, {
      ...summary,
      id: typeof row.book_id === "string" && row.book_id ? row.book_id : summary.id,
    });
  }
  return bookByUserBookId;
}

/** Books that have at least one of the signed-in user's notes. RLS still scopes rows. */
export async function listNotedBooksForUser(
  userId: string
): Promise<{ options: NotesBookFilterOption[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reading_notes")
    .select("user_book_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[readingNotes] noted books failed:", error);
    return { options: [], error: NOTES_BOOK_FILTER_COPY.error };
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.user_book_id) continue;
    counts.set(row.user_book_id, (counts.get(row.user_book_id) ?? 0) + 1);
  }

  const userBookIds = [...counts.keys()];
  const bookByUserBookId = await loadBooksByUserBookIds(supabase, userBookIds, userId);
  if (!bookByUserBookId) {
    return { options: [], error: NOTES_BOOK_FILTER_COPY.error };
  }

  const stubs = userBookIds.map((userBookId) => ({
    id: userBookId,
    user_book_id: userBookId,
    created_at: "",
    book: bookByUserBookId.get(userBookId) ?? null,
  }));

  return {
    options: buildNotesBookFilterOptions(stubs).map((option) => ({
      ...option,
      noteCount: counts.get(option.userBookId) ?? option.noteCount,
    })),
  };
}

async function enrichNotesWithBooks(
  notes: ReadingNote[]
): Promise<ReadingNoteWithBook[]> {
  if (notes.length === 0) return [];

  const supabase = createClient();
  const userBookIds = [...new Set(notes.map((note) => note.user_book_id))];

  const bookByUserBookId = await loadBooksByUserBookIds(supabase, userBookIds);

  if (!bookByUserBookId) {
    return notes.map((note) => ({ ...note, book: null }));
  }

  return notes.map((note) => ({
    ...note,
    book: bookByUserBookId.get(note.user_book_id) ?? null,
  }));
}

/** Profile notes — own profile returns all notes; others rely on RLS (public + friends_only for followers). */
export async function listProfileNotesForUser(
  userId: string,
  options: { isOwnProfile?: boolean; limit?: number } = {}
): Promise<ReadingNoteWithBook[]> {
  const limit = options.limit ?? 50;
  const notes = options.isOwnProfile
    ? await listNotes({ userId, limit })
    : await searchNotes({ userId, limit });
  return enrichNotesWithBooks(notes);
}

/** @deprecated Use listProfileNotesForUser — RLS already filters visibility for non-owners. */
export async function listPublicNotesForUser(
  userId: string,
  limit = 50
): Promise<ReadingNoteWithBook[]> {
  return listProfileNotesForUser(userId, { isOwnProfile: false, limit });
}
