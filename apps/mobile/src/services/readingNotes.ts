import { supabase } from "./supabase";
import {
  ENTITLEMENT_LIMIT_MESSAGES,
  canSaveQuote,
  toSubscriptionAccessFromRow,
} from "../utils/subscription";
import {
  NOTES_BOOK_FILTER_COPY,
  buildNotesBookFilterOptions,
  type NotesBookFilterOption,
} from "../../../../packages/utils/notesBookFilter";
import {
  HOME_RECENT_NOTED_BOOKS_LIMIT,
  pickLatestNotePerBook,
  selectRecentNotedBooks,
} from "../../../../packages/utils/recentNotesByBook";
import type { ReadingNote, ReadingNoteCategory, ReadingNoteVisibility } from "../types";

/**
 * Mobile reading notes service. Mirrors apps/web/src/lib/services/readingNotes.ts
 * against the `reading_notes` table + RLS (own notes; public/friends via RLS).
 */

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

export type ReadingNoteBookSummary = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
};

export type ReadingNoteWithBook = ReadingNote & {
  book: ReadingNoteBookSummary | null;
};

export type ReadingNoteSearchFilters = {
  userId?: string;
  bookId?: string;
  userBookId?: string;
  category?: ReadingNoteCategory;
  keyword?: string;
  limit?: number;
};

export const READING_NOTE_CATEGORIES: { value: ReadingNoteCategory; label: string; emoji: string }[] = [
  { value: "favorite_quote", label: "Favorite quote", emoji: "❝" },
  { value: "character_development", label: "Character development", emoji: "👤" },
  { value: "important_plot_point", label: "Plot point", emoji: "📌" },
  { value: "theory", label: "Theory", emoji: "🔮" },
  { value: "favorite_scene", label: "Favorite scene", emoji: "🎬" },
  { value: "emotional_moment", label: "Emotional moment", emoji: "💗" },
  { value: "general_note", label: "General note", emoji: "🗒️" },
];

function normalizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function listNotesByBook(userBookId: string): Promise<ReadingNote[]> {
  const { data, error } = await supabase
    .from("reading_notes")
    .select("*")
    .eq("user_book_id", userBookId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[readingNotes] list failed:", error);
    return [];
  }
  return (data ?? []) as ReadingNote[];
}

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
    bookByUserBookId.set(row.id as string, {
      ...summary,
      id:
        typeof row.book_id === "string" && row.book_id
          ? row.book_id
          : summary.id,
    });
  }
  return bookByUserBookId;
}

/** Books that have at least one of the signed-in user's notes. RLS still scopes rows. */
export async function listNotedBooksForUser(
  userId: string
): Promise<{ options: NotesBookFilterOption[]; error?: string }> {
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
    const userBookId = row.user_book_id as string | null;
    if (!userBookId) continue;
    counts.set(userBookId, (counts.get(userBookId) ?? 0) + 1);
  }

  const userBookIds = [...counts.keys()];
  const bookByUserBookId = await loadBooksByUserBookIds(userBookIds, userId);
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

export async function listRecentNotedBooksForHome(
  userId: string
): Promise<{ notes: ReadingNoteWithBook[]; error?: string }> {
  const { data: noteIds, error: noteIdsError } = await supabase
    .from("reading_notes")
    .select("user_book_id")
    .eq("user_id", userId);

  if (noteIdsError) {
    return { notes: [], error: NOTES_BOOK_FILTER_COPY.error };
  }

  const userBookIds = [
    ...new Set(
      (noteIds ?? [])
        .map((row) => row.user_book_id)
        .filter((id): id is string => typeof id === "string" && Boolean(id))
    ),
  ];
  if (userBookIds.length === 0) return { notes: [] };

  const { data: userBooks, error: booksError } = await supabase
    .from("user_books")
    .select("id, finished_at, started_at, updated_at")
    .eq("user_id", userId)
    .in("id", userBookIds);

  if (booksError) {
    return { notes: [], error: NOTES_BOOK_FILTER_COPY.error };
  }

  const selected = selectRecentNotedBooks(
    (userBooks ?? []).map((row) => ({
      userBookId: row.id,
      lastReadAt: row.finished_at ?? row.started_at,
      updatedAt: row.updated_at,
    }))
  );
  const selectedIds = selected.map((book) => book.userBookId);
  if (selectedIds.length === 0) return { notes: [] };

  const { data: latestNotes, error: notesError } = await supabase
    .from("reading_notes")
    .select("*")
    .eq("user_id", userId)
    .in("user_book_id", selectedIds)
    .order("created_at", { ascending: false })
    .limit(HOME_RECENT_NOTED_BOOKS_LIMIT * 8);

  if (notesError) {
    return { notes: [], error: NOTES_BOOK_FILTER_COPY.error };
  }

  const latestByBook = pickLatestNotePerBook(
    (latestNotes ?? []) as ReadingNote[],
    selectedIds
  );
  return { notes: await enrichNotesWithBooks([...latestByBook.values()]) };
}

async function enrichNotesWithBooks(notes: ReadingNote[]): Promise<ReadingNoteWithBook[]> {
  if (!notes.length) return [];

  const userBookIds = [...new Set(notes.map((note) => note.user_book_id))];
  const bookByUserBookId = await loadBooksByUserBookIds(userBookIds);
  if (!bookByUserBookId) {
    return notes.map((note) => ({ ...note, book: null }));
  }

  return notes.map((note) => ({
    ...note,
    book: bookByUserBookId.get(note.user_book_id) ?? null,
  }));
}

/** Profile notes — own profile returns all; others rely on RLS (public + friends_only). */
export async function listProfileNotesForUser(
  userId: string,
  options: { isOwnProfile?: boolean; limit?: number } = {}
): Promise<ReadingNoteWithBook[]> {
  const limit = options.limit ?? 50;
  const { notes } = await searchNotesWithBooks({ userId, limit });
  return notes;
}

export async function searchNotesWithBooks(
  filters: ReadingNoteSearchFilters
): Promise<{ notes: ReadingNoteWithBook[]; error?: string }> {
  let query = supabase
    .from("reading_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.userBookId) query = query.eq("user_book_id", filters.userBookId);
  if (filters.category) query = query.eq("category", filters.category);

  const { data, error } = await query;
  if (error) {
    console.error("[readingNotes] search failed:", error);
    return { notes: [], error: NOTES_BOOK_FILTER_COPY.error };
  }

  let notes = (data ?? []) as ReadingNote[];

  if (filters.bookId) {
    const allowed = await loadBooksByUserBookIds(
      [...new Set(notes.map((note) => note.user_book_id))],
      filters.userId
    );
    if (!allowed) {
      return { notes: [], error: NOTES_BOOK_FILTER_COPY.error };
    }
    notes = notes.filter((note) => allowed.get(note.user_book_id)?.id === filters.bookId);
  }

  const keyword = filters.keyword?.trim().toLowerCase();
  if (keyword) {
    notes = notes.filter((n) =>
      [n.note, n.quote, n.title, n.chapter]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(keyword))
    );
  }

  return { notes: await enrichNotesWithBooks(notes) };
}

export async function createReadingNote(
  userId: string,
  input: ReadingNoteInput
): Promise<{ error?: string; note?: ReadingNote }> {
  const payload = {
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

  if (!payload.note && !payload.quote) return { error: "Add a quote or a note." };

  const countsAsQuote =
    Boolean(payload.quote) || payload.category === "favorite_quote";

  if (countsAsQuote) {
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
  const updates: Record<string, unknown> = {};
  if (input.pageNumber !== undefined) updates.page_number = input.pageNumber;
  if (input.chapter !== undefined) updates.chapter = normalizeText(input.chapter);
  if (input.title !== undefined) updates.title = normalizeText(input.title);
  if (input.note !== undefined) updates.note = normalizeText(input.note);
  if (input.quote !== undefined) updates.quote = normalizeText(input.quote);
  if (input.category !== undefined) updates.category = input.category;
  if (input.visibility !== undefined) updates.visibility = input.visibility;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("reading_notes")
    .update(updates)
    .eq("id", noteId)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { note: data as ReadingNote };
}

export async function deleteReadingNote(noteId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("reading_notes").delete().eq("id", noteId);
  if (error) return { error: error.message };
  return {};
}
