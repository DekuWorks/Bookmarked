import { createClient } from "@/lib/supabase/client";
import { getShelvesInOrder } from "@/lib/constants/shelves";
import { computeShelfStatsFromItems, type ShelfStats } from "@bookmarked/utils/shelfStats";
import type { ShelfStatus } from "@/types";

export type { ShelfStats };

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
  total_pages?: number | null;
  tracking_format?: "book" | "audiobook" | null;
  listening_progress_seconds?: number;
  audiobook_duration_seconds?: number | null;
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
    format: "book" | "ebook" | "audiobook" | null;
    audiobook_duration_seconds?: number | null;
  } | null;
};

export type ShelfGroup = {
  status: ShelfStatus;
  title: string;
  slug: string;
  items: LibraryBookRow[];
};

const LIBRARY_SELECT =
  "id, shelf_status, progress_percent, progress_pages, total_pages, tracking_format, listening_progress_seconds, audiobook_duration_seconds, rating, is_favorite, finished_at, started_at, dnf, expected_read_date, created_at, updated_at, books(id, title, author, cover_url, page_count, subjects, external_id, external_source, description, published_date, publisher, isbn, format, audiobook_duration_seconds)";

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
  return getShelvesInOrder().map((shelf) => ({
    status: shelf.status,
    title: shelf.title,
    slug: shelf.slug,
    items: books.filter((b) => b.shelf_status === shelf.status),
  }));
}

/** Removes every book with this shelf status from the user's library. Other shelf statuses are untouched. */
export async function clearBuiltInShelf(
  userId: string,
  status: ShelfStatus
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("user_id", userId)
    .eq("shelf_status", status);

  if (error) return { error: error.message };
  return {};
}

const SHELVED_CATALOG_SOURCES = new Set(["isbndb", "open_library"]);

export type BookShelfMembership = {
  bookId: string;
  shelfStatus: ShelfStatus | null;
  isFavorite: boolean;
};

const CATALOG_MEMBERSHIP_SELECT =
  "book_id, shelf_status, is_favorite, books(id, external_id, external_source, isbn)";

type CatalogMembershipRow = {
  book_id: string;
  shelf_status: ShelfStatus | null;
  is_favorite: boolean | null;
  books:
    | {
        id: string;
        external_id: string | null;
        external_source: string | null;
        isbn: string | null;
      }
    | {
        id: string;
        external_id: string | null;
        external_source: string | null;
        isbn: string | null;
      }[]
    | null;
};

/**
 * Built-in shelf membership for the viewer's catalog books, keyed by every
 * external id / ISBN we recognize for a book (mirrors the id lookup used by
 * {@link getShelvedCatalogExternalIds}). Lets Search show current shelf
 * status and offer add/remove/move without a separate Library round-trip.
 */
export async function getBookShelfMemberships(
  userId: string
): Promise<Map<string, BookShelfMembership>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select(CATALOG_MEMBERSHIP_SELECT)
    .eq("user_id", userId);

  if (error) throw error;

  const memberships = new Map<string, BookShelfMembership>();
  for (const row of (data ?? []) as unknown as CatalogMembershipRow[]) {
    const rawBook = row.books;
    const book = Array.isArray(rawBook) ? rawBook[0] : rawBook;
    if (!book?.external_source || !SHELVED_CATALOG_SOURCES.has(book.external_source)) {
      continue;
    }

    const membership: BookShelfMembership = {
      bookId: book.id,
      shelfStatus: row.shelf_status,
      isFavorite: Boolean(row.is_favorite),
    };

    if (book.external_id) memberships.set(book.external_id, membership);
    if (book.isbn) memberships.set(book.isbn.replace(/[-\s]/g, ""), membership);
  }
  return memberships;
}

/** Catalog external IDs (ISBNs / legacy work ids) for books on the viewer's shelves. */
export async function getShelvedCatalogExternalIds(userId: string): Promise<Set<string>> {
  const memberships = await getBookShelfMemberships(userId);
  return new Set(memberships.keys());
}

/** @deprecated Use getShelvedCatalogExternalIds */
export async function getShelvedOpenLibraryWorkIds(userId: string): Promise<Set<string>> {
  return getShelvedCatalogExternalIds(userId);
}

export function computeShelfStats(books: LibraryBookRow[], status: ShelfStatus): ShelfStats {
  const items = books.filter((b) => b.shelf_status === status);
  return computeShelfStatsFromItems(items, status);
}
