import { supabase } from "./supabase";
import {
  buildQuoteGraphicAttribution,
  isQuoteGraphicEligibleNote,
  type QuoteGraphicSourceNote,
} from "../../../../packages/utils/quoteGraphics";
import type { QuoteGraphic } from "../types";
import { searchNotesWithBooks } from "./readingNotes";
import {
  consumeQuoteGraphicSlot,
  getQuoteGraphicsRemaining,
} from "./usageCounters";

const SELECT =
  "id, user_id, reading_note_id, book_id, user_book_id, quote_text, attribution, image_url, created_at";

export async function listQuoteGraphicSources(
  userId: string
): Promise<QuoteGraphicSourceNote[]> {
  const { notes } = await searchNotesWithBooks({ userId, limit: 400 });
  return notes.filter(isQuoteGraphicEligibleNote);
}

export async function listQuoteGraphics(userId: string): Promise<QuoteGraphic[]> {
  const { data, error } = await supabase
    .from("quote_graphics")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return hydrateGraphics((data ?? []) as QuoteGraphic[]);
}

export async function getQuoteGraphic(
  id: string,
  userId: string
): Promise<QuoteGraphic | null> {
  const { data, error } = await supabase
    .from("quote_graphics")
    .select(SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const [graphic] = await hydrateGraphics([data as QuoteGraphic]);
  return graphic ?? null;
}

export async function createQuoteGraphic(input: {
  userId: string;
  note: QuoteGraphicSourceNote;
}): Promise<{ graphic?: QuoteGraphic; remaining?: number; error?: string }> {
  const quote = input.note.quote?.trim();
  if (!quote) return { error: "Select a saved quote first." };

  const remainingBefore = await getQuoteGraphicsRemaining(input.userId);
  if (remainingBefore === 0) {
    return { error: "limit" };
  }

  const attribution = buildQuoteGraphicAttribution(input.note);
  const { data, error } = await supabase
    .from("quote_graphics")
    .insert({
      user_id: input.userId,
      reading_note_id: input.note.id,
      book_id: input.note.book?.id ?? null,
      user_book_id: input.note.user_book_id,
      quote_text: quote,
      attribution,
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not save graphic." };
  }

  const consumed = await consumeQuoteGraphicSlot(input.userId);
  if (!consumed.ok) {
    await supabase.from("quote_graphics").delete().eq("id", data.id).eq("user_id", input.userId);
    return { error: consumed.error };
  }

  const [graphic] = await hydrateGraphics([data as QuoteGraphic]);
  return { graphic, remaining: consumed.remaining };
}

export async function fetchQuoteGraphicsByIds(
  ids: string[]
): Promise<Map<string, QuoteGraphic>> {
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from("quote_graphics").select(SELECT).in("id", ids);
  if (error) return new Map();
  const rows = await hydrateGraphics((data ?? []) as QuoteGraphic[]);
  return new Map(rows.map((row) => [row.id, row]));
}

async function hydrateGraphics(rows: QuoteGraphic[]): Promise<QuoteGraphic[]> {
  const bookIds = [
    ...new Set(rows.map((row) => row.book_id).filter((id): id is string => Boolean(id))),
  ];
  if (!bookIds.length) return rows;
  const { data } = await supabase.from("books").select("id, title, author, cover_url").in("id", bookIds);
  const books = new Map((data ?? []).map((book) => [book.id as string, book]));
  return rows.map((row) => ({
    ...row,
    book: row.book_id
      ? {
          id: row.book_id,
          title: (books.get(row.book_id)?.title as string) ?? "Untitled",
          author: (books.get(row.book_id)?.author as string | null) ?? null,
          cover_url: (books.get(row.book_id)?.cover_url as string | null) ?? null,
        }
      : null,
  }));
}
