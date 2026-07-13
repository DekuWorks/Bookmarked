import { supabase } from "./supabase";
import type { ShelfStatus } from "../types";

/**
 * Series reading-order view. Mirrors apps/web/src/lib/services/series.ts against
 * the shared `books` catalog + the viewer's `user_books` (RLS) for shelf status.
 */

export type SeriesBook = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  series_position: number | null;
  shelf_status: ShelfStatus | null;
};

export type SeriesData = {
  name: string;
  books: SeriesBook[];
  inLibraryCount: number;
  readCount: number;
};

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getBooksInSeries(
  seriesName: string,
  userId?: string
): Promise<SeriesData> {
  const trimmed = seriesName.trim();
  if (!trimmed) return { name: seriesName, books: [], inLibraryCount: 0, readCount: 0 };

  const { data: catalogRows, error } = await supabase
    .from("books")
    .select("id, title, author, cover_url, series_name, series_position")
    .ilike("series_name", escapeIlike(trimmed))
    .order("series_position", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true })
    .limit(200);

  if (error) throw error;
  const rows = (catalogRows ?? []) as {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    series_name: string | null;
    series_position: number | null;
  }[];
  if (!rows.length) return { name: trimmed, books: [], inLibraryCount: 0, readCount: 0 };

  const shelfByBook = new Map<string, ShelfStatus>();
  if (userId) {
    const { data: userBooks } = await supabase
      .from("user_books")
      .select("book_id, shelf_status")
      .eq("user_id", userId)
      .in("book_id", rows.map((row) => row.id));
    for (const row of userBooks ?? []) {
      if (row.book_id) shelfByBook.set(row.book_id as string, row.shelf_status as ShelfStatus);
    }
  }

  const books: SeriesBook[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    cover_url: row.cover_url,
    series_position: row.series_position,
    shelf_status: shelfByBook.get(row.id) ?? null,
  }));

  return {
    name: rows[0].series_name?.trim() || trimmed,
    books,
    inLibraryCount: books.filter((b) => b.shelf_status !== null).length,
    readCount: books.filter((b) => b.shelf_status === "read").length,
  };
}
