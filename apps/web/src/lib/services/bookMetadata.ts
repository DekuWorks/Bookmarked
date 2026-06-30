import { createClient } from "@/lib/supabase/client";
import {
  fetchGoogleBooksVolume,
  resolveBookCoverUrl,
} from "@/lib/services/covers";
import {
  fetchOpenLibraryWorkDetails,
  fetchWorkEditions,
  openLibraryCoverUrl,
} from "@/lib/services/openLibrary";
import type { Book } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function bookNeedsCatalogEnrichment(book: Book): boolean {
  if (book.external_source !== "open_library" || !book.external_id) {
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
  ol: Awaited<ReturnType<typeof fetchOpenLibraryWorkDetails>>,
  google: Awaited<ReturnType<typeof fetchGoogleBooksVolume>>
): Partial<Book> {
  const updates: Partial<Book> = {};

  if (!book.description?.trim()) {
    if (ol?.description) updates.description = ol.description;
    else if (google?.description) updates.description = google.description;
  }

  if (!(book.subjects && book.subjects.length) && ol?.subjects.length) {
    updates.subjects = ol.subjects;
  }

  if (!book.published_date) {
    if (ol?.published_date) updates.published_date = ol.published_date;
    else if (google?.publishedDate) updates.published_date = google.publishedDate;
  }

  if (!book.publisher) {
    if (ol?.publisher) updates.publisher = ol.publisher;
    else if (google?.publisher) updates.publisher = google.publisher;
  }

  if (!book.page_count) {
    if (ol?.page_count) updates.page_count = ol.page_count;
    else if (google?.pageCount) updates.page_count = google.pageCount;
  }

  return updates;
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
  if (!bookNeedsCatalogEnrichment(book)) return book;

  const ol =
    book.external_source === "open_library" && book.external_id
      ? await fetchOpenLibraryWorkDetails(book.external_id)
      : null;

  const needsGoogle =
    !book.description?.trim() ||
    !book.cover_url?.trim() ||
    !book.page_count ||
    !book.published_date ||
    !book.publisher;

  const google = needsGoogle
    ? await fetchGoogleBooksVolume({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
      })
    : null;

  const metadataUpdates = buildMetadataUpdates(book, ol, google);
  let current = await persistBookUpdates(supabase, book.id, metadataUpdates, book);

  if (!current.cover_url?.trim()) {
    const coverUrl =
      (await resolveBookCoverUrl({
        coverUrl: current.cover_url,
        isbn: current.isbn,
        title: current.title,
        author: current.author,
      })) ??
      google?.coverUrl ??
      null;

    if (coverUrl) {
      current = await persistBookUpdates(
        supabase,
        current.id,
        { cover_url: coverUrl },
        current
      );
    }
  }

  return current;
}

export async function refreshBookFromOpenLibrary(
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

  if (row.external_source !== "open_library" || !row.external_id) {
    return { error: "This book is not linked to Open Library." };
  }

  const ol = await fetchOpenLibraryWorkDetails(row.external_id);
  if (!ol) {
    return { error: "Could not fetch metadata from Open Library." };
  }

  const updates: Partial<Book> = {};

  if (ol.description) updates.description = ol.description;
  if (ol.subjects.length > 0) updates.subjects = ol.subjects;
  if (ol.published_date) updates.published_date = ol.published_date;
  if (ol.publisher) updates.publisher = ol.publisher;
  if (ol.page_count) updates.page_count = ol.page_count;

  const editions = await fetchWorkEditions(row.external_id, 5);
  const coverId = editions.find((edition) => edition.coverId)?.coverId ?? null;
  const olCover = coverId ? openLibraryCoverUrl(coverId) : null;
  const resolvedCover =
    olCover ??
    (await resolveBookCoverUrl({
      coverUrl: row.cover_url,
      isbn: row.isbn,
      title: row.title,
      author: row.author,
    }));

  if (resolvedCover) {
    updates.cover_url = resolvedCover;
  }

  if (Object.keys(updates).length === 0) {
    return { book: row };
  }

  const refreshed = await persistBookUpdates(supabase, row.id, updates, row);
  return { book: refreshed };
}
