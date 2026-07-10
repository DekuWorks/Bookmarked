import { createClient } from "@/lib/supabase/client";
import {
  fetchIsbndbBookDetails,
  ISBNDB_SOURCE,
} from "@/lib/services/isbndb";
import type { Book } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const CATALOG_SOURCES = new Set(["isbndb", "open_library"]);

export function bookNeedsCatalogEnrichment(book: Book): boolean {
  const linked =
    Boolean(book.external_id) &&
    (!book.external_source || CATALOG_SOURCES.has(book.external_source));

  if (!linked) {
    return !book.cover_url?.trim();
  }

  return (
    !book.description?.trim() ||
    !book.cover_url?.trim() ||
    !book.page_count ||
    !book.published_date ||
    !book.publisher ||
    !(book.subjects && book.subjects.length > 0)
  );
}

function buildMetadataUpdates(
  book: Book,
  details: Awaited<ReturnType<typeof fetchIsbndbBookDetails>>
): Partial<Book> {
  if (!details) return {};

  const updates: Partial<Book> = {};

  if (!book.description?.trim() && details.description) {
    updates.description = details.description;
  }
  if (!(book.subjects && book.subjects.length) && details.subjects.length) {
    updates.subjects = details.subjects;
  }
  if (!book.published_date && details.published_date) {
    updates.published_date = details.published_date;
  }
  if (!book.publisher && details.publisher) {
    updates.publisher = details.publisher;
  }
  if (!book.page_count && details.page_count) {
    updates.page_count = details.page_count;
  }
  if (!book.cover_url?.trim() && details.cover_url) {
    updates.cover_url = details.cover_url;
  }
  if (!book.isbn && details.isbn) {
    updates.isbn = details.isbn;
  }

  return updates;
}

/** Resolve cover from ISBNdb only. */
export async function resolveCatalogCoverForBook(book: Book): Promise<string | null> {
  if (book.cover_url?.trim() && !book.cover_url.includes("covers.openlibrary.org")) {
    return book.cover_url.trim();
  }

  if (!book.external_id && !book.isbn) {
    return book.cover_url?.trim() || null;
  }

  const details = await fetchIsbndbBookDetails(book.isbn ?? book.external_id ?? "");
  return details?.cover_url ?? book.cover_url?.trim() ?? null;
}

async function syncBookCover(
  supabase: SupabaseClient,
  book: Book
): Promise<Book> {
  const coverUrl = await resolveCatalogCoverForBook(book);
  if (!coverUrl || coverUrl === book.cover_url) return book;

  return persistBookUpdates(supabase, book.id, { cover_url: coverUrl }, book);
}

async function persistBookUpdates(
  supabase: SupabaseClient,
  bookId: string,
  updates: Partial<Book>,
  fallback: Book
): Promise<Book> {
  if (Object.keys(updates).length === 0) return fallback;

  const merged = { ...fallback, ...updates } as Book;

  const { data: updated, error } = await supabase
    .from("books")
    .update(updates)
    .eq("id", bookId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.warn("[bookMetadata] catalog update failed:", error.message);
    return merged;
  }

  return (updated as Book | null) ?? merged;
}

/** @deprecated Use enrichBookCatalogEntry */
export const bookNeedsMetadataEnrichment = bookNeedsCatalogEnrichment;

/** @deprecated Use enrichBookCatalogEntry */
export async function enrichBookFromOpenLibrary(
  supabase: SupabaseClient,
  book: Book
): Promise<Book> {
  return enrichBookCatalogEntry(supabase, book);
}

export async function enrichBookCatalogEntry(
  supabase: SupabaseClient,
  book: Book
): Promise<Book> {
  if (!bookNeedsCatalogEnrichment(book)) {
    return syncBookCover(supabase, book);
  }

  const lookupId = book.isbn ?? book.external_id;
  const details = lookupId
    ? await fetchIsbndbBookDetails(lookupId).catch((error) => {
        console.warn("[bookMetadata] ISBNdb fetch failed:", error);
        return null;
      })
    : null;

  const metadataUpdates = buildMetadataUpdates(book, details);

  // Prefer ISBNdb covers even when replacing legacy Open Library URLs
  if (details?.cover_url) {
    metadataUpdates.cover_url = details.cover_url;
  }
  if (details && book.external_source !== ISBNDB_SOURCE && details.isbn) {
    metadataUpdates.external_source = ISBNDB_SOURCE;
    metadataUpdates.external_id = details.isbn;
  }

  let current = await persistBookUpdates(supabase, book.id, metadataUpdates, book);
  current = await syncBookCover(supabase, current);
  return current;
}

export async function refreshBookFromOpenLibrary(
  bookId: string
): Promise<{ book?: Book; error?: string }> {
  return refreshBookFromCatalog(bookId);
}

export async function refreshBookFromCatalog(
  bookId: string
): Promise<{ book?: Book; error?: string }> {
  const supabase = createClient();

  const { data: book, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (error || !book) {
    return { error: "Book not found." };
  }

  const row = book as Book;
  const lookupId = row.isbn ?? row.external_id;
  if (!lookupId) {
    return { error: "This book is not linked to the catalog." };
  }

  const details = await fetchIsbndbBookDetails(lookupId);
  if (!details) {
    return { error: "Could not fetch metadata from ISBNdb." };
  }

  const updates: Partial<Book> = {
    external_source: ISBNDB_SOURCE,
  };

  if (details.isbn) updates.external_id = details.isbn;
  if (details.description) updates.description = details.description;
  if (details.subjects.length > 0) updates.subjects = details.subjects;
  if (details.published_date) updates.published_date = details.published_date;
  if (details.publisher) updates.publisher = details.publisher;
  if (details.page_count) updates.page_count = details.page_count;
  if (details.cover_url) updates.cover_url = details.cover_url;
  if (details.isbn) updates.isbn = details.isbn;
  if (details.title) updates.title = details.title;
  if (details.author) updates.author = details.author;

  if (Object.keys(updates).length <= 1) {
    return { book: row };
  }

  const refreshed = await persistBookUpdates(supabase, row.id, updates, row);
  return { book: refreshed };
}
