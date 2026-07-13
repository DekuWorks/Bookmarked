import { supabase } from "./supabase";
import type { ShelfStatus } from "../types";

/**
 * Books by author. Mirrors apps/web/src/lib/services/authorBooks.ts: the shared
 * catalog books plus which of them the viewer already has on a shelf.
 */

export type AuthorCatalogBook = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  external_id: string | null;
};

export type AuthorLibraryBook = AuthorCatalogBook & { shelf_status: ShelfStatus };

export type AuthorBooksResult = {
  libraryBooks: AuthorLibraryBook[];
  catalogBooks: AuthorCatalogBook[];
};

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getBooksByAuthor(
  authorName: string,
  userId: string
): Promise<AuthorBooksResult> {
  const trimmed = authorName.trim();
  if (!trimmed) return { libraryBooks: [], catalogBooks: [] };

  const pattern = `%${escapeIlike(trimmed)}%`;

  const [catalogResult, libraryResult] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, author, cover_url, external_id")
      .ilike("author", pattern)
      .order("title", { ascending: true })
      .limit(50),
    supabase
      .from("user_books")
      .select("shelf_status, books!inner(id, title, author, cover_url, external_id)")
      .eq("user_id", userId)
      .ilike("books.author", pattern)
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  if (catalogResult.error) throw catalogResult.error;
  if (libraryResult.error) throw libraryResult.error;

  const libraryBooks: AuthorLibraryBook[] = (libraryResult.data ?? [])
    .map((row) => {
      const rawBook = row.books;
      const book = (Array.isArray(rawBook) ? rawBook[0] : rawBook) as AuthorCatalogBook | null;
      if (!book?.id) return null;
      return { ...book, shelf_status: row.shelf_status as ShelfStatus };
    })
    .filter((book): book is AuthorLibraryBook => book !== null);

  const libraryIds = new Set(libraryBooks.map((book) => book.id));
  const catalogBooks = ((catalogResult.data ?? []) as unknown as AuthorCatalogBook[]).filter(
    (book) => !libraryIds.has(book.id)
  );

  return { libraryBooks, catalogBooks };
}
