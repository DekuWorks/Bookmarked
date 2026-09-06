import { supabase } from "./supabase";
import {
  buildQuotePdfDocument,
  isOwnQuoteExport,
  quotePdfFilename,
  type QuotePdfItem,
} from "../../../../packages/utils/quotePdf";

export async function exportOwnQuotesPdf(
  userId: string,
  ownerName?: string | null
): Promise<{ error?: string; filename?: string; bytes?: Uint8Array; items?: QuotePdfItem[] }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isOwnQuoteExport(user.id, userId)) {
    return { error: "You can only export your own quotes." };
  }

  const { data, error } = await supabase
    .from("reading_notes")
    .select("quote, note, page_number, chapter, category, user_book_id")
    .eq("user_id", user.id)
    .or("quote.not.is.null,category.eq.favorite_quote")
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  const notes = data ?? [];
  const userBookIds = [...new Set(notes.map((row) => row.user_book_id).filter(Boolean))];
  const booksByUserBook = new Map<string, { title: string; author: string | null }>();

  if (userBookIds.length > 0) {
    const { data: books } = await supabase
      .from("user_books")
      .select("id, books(title, author)")
      .eq("user_id", user.id)
      .in("id", userBookIds);
    for (const row of books ?? []) {
      const book = Array.isArray(row.books) ? row.books[0] : row.books;
      booksByUserBook.set(row.id as string, {
        title: book?.title ?? "Untitled",
        author: book?.author ?? null,
      });
    }
  }

  const items: QuotePdfItem[] = notes
    .filter((row) => Boolean(row.quote) || row.category === "favorite_quote")
    .map((row) => {
      const book = booksByUserBook.get(row.user_book_id as string);
      return {
        quote: (row.quote as string | null) ?? "",
        note: (row.note as string | null) ?? null,
        bookTitle: book?.title ?? null,
        bookAuthor: book?.author ?? null,
        pageNumber: (row.page_number as number | null) ?? null,
        chapter: (row.chapter as string | null) ?? null,
      };
    });

  return {
    filename: quotePdfFilename(),
    bytes: buildQuotePdfDocument(items, { ownerName }),
    items,
  };
}
