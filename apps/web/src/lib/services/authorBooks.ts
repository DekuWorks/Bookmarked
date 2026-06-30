import { createClient } from "@/lib/supabase/client";
import type { ShelfStatus } from "@/types";

export type AuthorCatalogBook = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
};

export type AuthorLibraryBook = AuthorCatalogBook & {
  shelf_status: ShelfStatus;
};

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function authorPattern(name: string): string {
  return `%${escapeIlike(name.trim())}%`;
}

export async function getBooksByAuthor(
  authorName: string,
  userId: string
): Promise<{ libraryBooks: AuthorLibraryBook[]; catalogBooks: AuthorCatalogBook[] }> {
  const trimmed = authorName.trim();
  if (!trimmed) {
    return { libraryBooks: [], catalogBooks: [] };
  }

  const pattern = authorPattern(trimmed);
  const supabase = createClient();

  const [catalogResult, libraryResult] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, author, cover_url")
      .ilike("author", pattern)
      .order("title", { ascending: true })
      .limit(50),
    supabase
      .from("user_books")
      .select("shelf_status, books!inner(id, title, author, cover_url)")
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
      return {
        ...book,
        shelf_status: row.shelf_status as ShelfStatus,
      };
    })
    .filter((book): book is AuthorLibraryBook => book !== null);

  const libraryIds = new Set(libraryBooks.map((book) => book.id));

  const catalogBooks = ((catalogResult.data ?? []) as AuthorCatalogBook[]).filter(
    (book) => !libraryIds.has(book.id)
  );

  return { libraryBooks, catalogBooks };
}
