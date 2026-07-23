import { createClient } from "@/lib/supabase/client";
import { SHELF_CONFIG } from "@/lib/constants/shelves";
import type { ShelfStatus } from "@/types";

export type LibraryBookRow = {
  id: string;
  shelf_status: ShelfStatus;
  progress_percent: number;
  progress_pages: number;
  rating: number | null;
  is_favorite: boolean;
  finished_at: string | null;
  started_at: string | null;
  dnf: boolean;
  expected_read_date: string | null;
  updated_at: string;
  created_at: string;
  books: {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    page_count: number | null;
    subjects: string[] | null;
    external_id: string | null;
    external_source: string | null;
    description: string | null;
    published_date: string | null;
    publisher: string | null;
    isbn: string | null;
  } | null;
};

export type ShelfGroup = {
  status: ShelfStatus;
  title: string;
  slug: string;
  items: LibraryBookRow[];
};

const LIBRARY_SELECT =
  "id, shelf_status, progress_percent, progress_pages, rating, is_favorite, finished_at, started_at, dnf, expected_read_date, created_at, updated_at, books(id, title, author, cover_url, page_count, subjects, external_id, external_source, description, published_date, publisher, isbn)";

export async function getUserLibraryBooks(userId: string): Promise<LibraryBookRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select(LIBRARY_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as LibraryBookRow[];
}

export function groupBooksByShelf(books: LibraryBookRow[]): ShelfGroup[] {
  return SHELF_CONFIG.map((shelf) => ({
    status: shelf.status,
    title: shelf.title,
    slug: shelf.slug,
    items: books.filter((b) => b.shelf_status === shelf.status),
  }));
}

const SHELVED_CATALOG_SOURCES = new Set(["isbndb", "open_library"]);

/** Catalog external IDs (ISBNs / legacy work ids) for books on the viewer's shelves. */
export async function getShelvedCatalogExternalIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select("books(external_id, external_source, isbn)")
    .eq("user_id", userId);

  if (error) throw error;

  const workIds = new Set<string>();
  for (const row of data ?? []) {
    const rawBook = row.books;
    const book = (Array.isArray(rawBook) ? rawBook[0] : rawBook) as
      | {
          external_id: string | null;
          external_source: string | null;
          isbn: string | null;
        }
      | null
      | undefined;
    if (!book?.external_source || !SHELVED_CATALOG_SOURCES.has(book.external_source)) {
      continue;
    }
    if (book.external_id) workIds.add(book.external_id);
    if (book.isbn) workIds.add(book.isbn.replace(/[-\s]/g, ""));
  }
  return workIds;
}

/** @deprecated Use getShelvedCatalogExternalIds */
export async function getShelvedOpenLibraryWorkIds(userId: string): Promise<Set<string>> {
  return getShelvedCatalogExternalIds(userId);
}

export type ShelfStats = {
  totalBooks: number;
  averageProgress: number;
  averageRating: number | null;
  pagesRead: number;
  finishedThisMonth: number;
};

export function computeShelfStats(books: LibraryBookRow[], status: ShelfStatus): ShelfStats {
  const items = books.filter((b) => b.shelf_status === status);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const withProgress = items.filter((b) => Number(b.progress_percent) > 0);
  const averageProgress =
    withProgress.length > 0
      ? withProgress.reduce((sum, b) => sum + Number(b.progress_percent), 0) / withProgress.length
      : 0;

  const rated = items.filter((b) => b.rating != null);
  const averageRating =
    rated.length > 0
      ? rated.reduce((sum, b) => sum + Number(b.rating), 0) / rated.length
      : null;

  const pagesRead = items.reduce((sum, b) => sum + (Number(b.progress_pages) || 0), 0);

  const finishedThisMonth =
    status === "read"
      ? items.filter((b) => b.finished_at && new Date(b.finished_at) >= monthStart).length
      : 0;

  return {
    totalBooks: items.length,
    averageProgress,
    averageRating,
    pagesRead,
    finishedThisMonth,
  };
}
