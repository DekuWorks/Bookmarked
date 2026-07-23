import { completeReadingSession } from "./completeReadingSession";
import { supabase } from "./supabase";
import { activityMetadata, bookActivityContext, recordActivity } from "./activity";
import { getShelfConfig } from "../constants/shelves";
import type { CatalogDoc } from "./isbndb";
import type { ShelfStatus } from "../types";

/**
 * Mobile books service — a trimmed port of apps/web/src/lib/services/books.ts.
 * Upserts an ISBNdb catalog result into the shared `books` table (matching by
 * ISBN, then external id) and adds/moves it onto a shelf.
 */

const ISBNDB_SOURCE = "isbndb";

export async function ensureCatalogBook(
  doc: CatalogDoc
): Promise<{ bookId?: string; error?: string }> {
  const title = doc.title?.trim();
  const externalId = doc.key?.trim();
  if (!title || !externalId) return { error: "Invalid book data." };

  const isbn = doc.isbn?.[0]?.trim() || externalId;
  const author = doc.author_name?.filter(Boolean).join(", ") || null;
  const coverUrl = doc.cover_url?.trim() || null;
  const publishedDate = doc.first_publish_year ? String(doc.first_publish_year) : null;
  const pageCount = doc.number_of_pages_median ?? null;

  const { data: existingByIsbn } = await supabase
    .from("books")
    .select("id, cover_url, isbn, page_count")
    .eq("isbn", isbn)
    .maybeSingle();

  const { data: existingByExternal } = !existingByIsbn
    ? await supabase
        .from("books")
        .select("id, cover_url, isbn, page_count")
        .eq("external_source", ISBNDB_SOURCE)
        .eq("external_id", externalId)
        .maybeSingle()
    : { data: null };

  const existing = existingByIsbn ?? existingByExternal;

  if (existing?.id) {
    const patch: Record<string, unknown> = { external_source: ISBNDB_SOURCE, external_id: externalId };
    if (coverUrl && !existing.cover_url) patch.cover_url = coverUrl;
    if (isbn && !existing.isbn) patch.isbn = isbn;
    if (pageCount && pageCount > 0 && !existing.page_count) patch.page_count = pageCount;
    if (Object.keys(patch).length > 1) {
      await supabase.from("books").update(patch).eq("id", existing.id);
    }
    return { bookId: existing.id as string };
  }

  const { data: inserted, error } = await supabase
    .from("books")
    .insert({
      external_source: ISBNDB_SOURCE,
      external_id: externalId,
      title,
      author,
      cover_url: coverUrl,
      isbn,
      page_count: pageCount,
      published_date: publishedDate,
      description: doc.synopsis ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { bookId: inserted.id as string };
}

export async function addCatalogBookToShelf(
  doc: CatalogDoc,
  shelf: ShelfStatus,
  options?: { manualPageCount?: number | null }
): Promise<{ error?: string; bookId?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const ensured = await ensureCatalogBook(doc);
  if (ensured.error || !ensured.bookId) return { error: ensured.error ?? "Could not add book." };
  const bookId = ensured.bookId;

  const { data: existingUserBook } = await supabase
    .from("user_books")
    .select(
      "id, shelf_status, progress_pages, read_count, started_at, is_favorite, rating, completion_tags"
    )
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existingUserBook?.shelf_status === shelf) return { bookId };

  const previousShelf = existingUserBook?.shelf_status ?? null;
  const previousPage = Number(existingUserBook?.progress_pages) || 0;
  const now = new Date().toISOString();
  const catalogPageCount = doc.number_of_pages_median ?? null;
  const isbn = doc.isbn?.[0]?.trim() || doc.key?.trim() || null;

  if (shelf === "read" && previousShelf !== "read") {
    const { data: userBook, error: shelfError } = await supabase
      .from("user_books")
      .upsert(
        {
          user_id: user.id,
          book_id: bookId,
          updated_at: now,
          started_at: existingUserBook?.started_at ?? now,
        },
        { onConflict: "user_id,book_id" }
      )
      .select("id, started_at, read_count, is_favorite, rating, completion_tags")
      .single();

    if (shelfError) return { error: shelfError.message };

    const { data: bookRow } = await supabase
      .from("books")
      .select("id, title, page_count, cover_url, subjects, isbn")
      .eq("id", bookId)
      .maybeSingle();

    const completion = await completeReadingSession({
      userId: user.id,
      bookId,
      userBookId: userBook.id,
      bookTitle: bookRow?.title ?? doc.title,
      book: {
        id: bookId,
        page_count: bookRow?.page_count ?? catalogPageCount,
        cover_url: bookRow?.cover_url ?? doc.cover_url ?? null,
        subjects: bookRow?.subjects ?? null,
        isbn: bookRow?.isbn ?? isbn,
      },
      editionSelected: Boolean(isbn),
      previousPage,
      readNumber: Number(existingUserBook?.read_count) || 1,
      finishedAt: now,
      startedAt: userBook.started_at ?? now,
      manualPageCount: options?.manualPageCount,
      source: "search_add",
      applyCompletionTags: Boolean(existingUserBook),
      completionTagsState: existingUserBook
        ? {
            read_count: userBook.read_count ?? existingUserBook.read_count,
            is_favorite: userBook.is_favorite ?? existingUserBook.is_favorite,
            rating: userBook.rating ?? existingUserBook.rating,
            completion_tags: userBook.completion_tags ?? existingUserBook.completion_tags,
          }
        : undefined,
    });

    if (completion.error) return { error: completion.error };
    return { bookId };
  }

  const patch: Record<string, unknown> = {
    user_id: user.id,
    book_id: bookId,
    shelf_status: shelf,
    updated_at: now,
  };
  if (shelf === "currently_reading") patch.started_at = existingUserBook?.started_at ?? now;

  const { data: userBook, error } = await supabase
    .from("user_books")
    .upsert(patch, { onConflict: "user_id,book_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await recordActivity({
    user_id: user.id,
    event_type: existingUserBook ? "shelf_updated" : "book_added",
    entity_type: "user_book",
    entity_id: userBook?.id ?? null,
    metadata_json: activityMetadata(doc.title, {
      ...bookActivityContext({ id: bookId, cover_url: doc.cover_url ?? null }),
      shelf_status: shelf,
      previous_shelf_status: previousShelf,
    }),
  });

  return { bookId };
}
