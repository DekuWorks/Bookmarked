import { supabase } from "./supabase";
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

export type ReadingNoteWithBook = ReadingNote & {
  book: { id: string; title: string; cover_url: string | null } | null;
};

export type ReadingNoteSearchFilters = {
  userId?: string;
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

async function enrichNotesWithBooks(notes: ReadingNote[]): Promise<ReadingNoteWithBook[]> {
  if (!notes.length) return [];

  const userBookIds = [...new Set(notes.map((note) => note.user_book_id))];
  const { data, error } = await supabase
    .from("user_books")
    .select("id, books(id, title, cover_url)")
    .in("id", userBookIds);

  if (error) {
    return notes.map((note) => ({ ...note, book: null }));
  }

  const bookByUserBookId = new Map<
    string,
    { id: string; title: string; cover_url: string | null }
  >();
  for (const row of data ?? []) {
    const book = row.books as
      | { id: string; title: string; cover_url: string | null }
      | { id: string; title: string; cover_url: string | null }[]
      | null;
    const resolved = Array.isArray(book) ? book[0] : book;
    if (!resolved?.id) continue;
    bookByUserBookId.set(row.id as string, resolved);
  }

  return notes.map((note) => ({
    ...note,
    book: bookByUserBookId.get(note.user_book_id) ?? null,
  }));
}

export async function searchNotesWithBooks(
  filters: ReadingNoteSearchFilters
): Promise<ReadingNoteWithBook[]> {
  let query = supabase
    .from("reading_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.category) query = query.eq("category", filters.category);

  const { data, error } = await query;
  if (error) {
    console.error("[readingNotes] search failed:", error);
    return [];
  }

  let notes = (data ?? []) as ReadingNote[];
  const keyword = filters.keyword?.trim().toLowerCase();
  if (keyword) {
    notes = notes.filter((n) =>
      [n.note, n.quote, n.title, n.chapter]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(keyword))
    );
  }

  return enrichNotesWithBooks(notes);
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

  const { data, error } = await supabase
    .from("reading_notes")
    .insert(payload)
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
