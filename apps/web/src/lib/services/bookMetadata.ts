import { fetchOpenLibraryWorkDetails } from "@/lib/services/openLibrary";
import type { Book } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function bookNeedsMetadataEnrichment(book: Book): boolean {
  if (book.external_source !== "open_library" || !book.external_id) return false;
  return (
    !book.description?.trim() ||
    !book.page_count ||
    !book.published_date ||
    !book.publisher ||
    !(book.subjects && book.subjects.length > 0)
  );
}

function buildMetadataUpdates(book: Book, ol: Awaited<ReturnType<typeof fetchOpenLibraryWorkDetails>>): Partial<Book> {
  if (!ol) return {};

  const updates: Partial<Book> = {};
  if (!book.description?.trim() && ol.description) updates.description = ol.description;
  if (!(book.subjects && book.subjects.length) && ol.subjects.length) updates.subjects = ol.subjects;
  if (!book.published_date && ol.published_date) updates.published_date = ol.published_date;
  if (!book.publisher && ol.publisher) updates.publisher = ol.publisher;
  if (!book.page_count && ol.page_count) updates.page_count = ol.page_count;

  return updates;
}

export async function enrichBookFromOpenLibrary(
  supabase: SupabaseClient,
  book: Book
): Promise<Book> {
  if (!bookNeedsMetadataEnrichment(book) || !book.external_id) return book;

  const ol = await fetchOpenLibraryWorkDetails(book.external_id);
  const updates = buildMetadataUpdates(book, ol);
  if (Object.keys(updates).length === 0) return book;

  const merged = { ...book, ...updates } as Book;

  const { data: updated, error } = await supabase
    .from("books")
    .update(updates)
    .eq("id", book.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.warn("[bookMetadata] catalog update failed:", error.message);
    return merged;
  }

  return (updated as Book | null) ?? merged;
}
