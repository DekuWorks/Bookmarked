import { createClient } from "@/lib/supabase/client";
import type { ShelfStatus } from "@/types";

export type SeriesBook = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  series_position: number | null;
  entry_type: string | null;
  /** The viewer's shelf status for this book, if it's on a shelf. */
  shelf_status: ShelfStatus | null;
};

export type SeriesData = {
  /** Canonical display name (from the first matched catalog row). */
  name: string;
  books: SeriesBook[];
  /** Books the viewer has on any shelf. */
  inLibraryCount: number;
  /** Books the viewer has marked as read. */
  readCount: number;
};

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

type CatalogSeriesRow = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  series_name: string | null;
  series_position: number | null;
};

/**
 * All catalog books sharing a series name (case-insensitive), ordered by
 * series position, annotated with the viewer's shelf status. Mirrors the
 * Goodreads "series" view: reading order + what the reader already has.
 */
export async function getBooksInSeries(
  seriesName: string,
  userId?: string
): Promise<SeriesData> {
  const trimmed = seriesName.trim();
  if (!trimmed) {
    return { name: seriesName, books: [], inLibraryCount: 0, readCount: 0 };
  }

  const supabase = createClient();

  const { data: curatedSeries, error: curatedError } = await supabase
    .from("book_series")
    .select("id, name")
    .ilike("name", escapeIlike(trimmed))
    .maybeSingle();
  if (curatedError) throw curatedError;

  const { data: curatedEntries, error: entriesError } = curatedSeries
    ? await supabase
        .from("book_series_entries")
        .select("book_id, position, entry_type")
        .eq("series_id", curatedSeries.id)
        .order("position", { ascending: true, nullsFirst: false })
    : { data: null, error: null };
  if (entriesError) throw entriesError;

  const { data: catalogRows, error } = curatedEntries?.length
    ? await supabase
        .from("books")
        .select("id, title, author, cover_url, series_name, series_position")
        .in("id", curatedEntries.map((entry) => entry.book_id))
    : await supabase
    .from("books")
    .select("id, title, author, cover_url, series_name, series_position")
    .ilike("series_name", escapeIlike(trimmed))
    .order("series_position", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true })
    .limit(200);

  if (error) throw error;

  let rows = (catalogRows ?? []) as CatalogSeriesRow[];
  if (curatedEntries?.length) {
    const entryByBook = new Map(curatedEntries.map((entry) => [entry.book_id, entry]));
    rows = [...rows].sort(
      (a, b) => Number(entryByBook.get(a.id)?.position ?? Infinity) - Number(entryByBook.get(b.id)?.position ?? Infinity)
    );
  }
  if (rows.length === 0) {
    return { name: trimmed, books: [], inLibraryCount: 0, readCount: 0 };
  }

  const shelfByBook = new Map<string, ShelfStatus>();
  if (userId) {
    const { data: userBooks, error: userError } = await supabase
      .from("user_books")
      .select("book_id, shelf_status")
      .eq("user_id", userId)
      .in(
        "book_id",
        rows.map((row) => row.id)
      );

    if (userError) throw userError;

    for (const row of userBooks ?? []) {
      if (row.book_id) {
        shelfByBook.set(row.book_id, row.shelf_status as ShelfStatus);
      }
    }
  }

  const books: SeriesBook[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    cover_url: row.cover_url,
    series_position: curatedEntries
      ? Number(curatedEntries.find((entry) => entry.book_id === row.id)?.position ?? row.series_position)
      : row.series_position,
    entry_type: curatedEntries?.find((entry) => entry.book_id === row.id)?.entry_type ?? null,
    shelf_status: shelfByBook.get(row.id) ?? null,
  }));

  const inLibraryCount = books.filter((b) => b.shelf_status !== null).length;
  const readCount = books.filter((b) => b.shelf_status === "read").length;

  // Prefer the canonical casing that appears most often in the catalog.
  const name = curatedSeries?.name?.trim() || rows[0].series_name?.trim() || trimmed;

  return { name, books, inLibraryCount, readCount };
}
