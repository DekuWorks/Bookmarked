import { createClient } from "@/lib/supabase/client";
import { getShelfLabel, isShelfStatus } from "@/lib/constants/shelfLabels";
import { activityMetadata, bookActivityContext, recordActivity } from "@/lib/services/activity";
import { completeReadingSession } from "@/lib/services/completeReadingSession";
import { trackReadingCompleted } from "@/lib/services/productAnalytics";
import { enrichBookCatalogEntry } from "@/lib/services/bookMetadata";
import { resolveBookCoverUrl } from "@/lib/services/covers";
import { ISBNDB_SOURCE } from "@/lib/services/isbndb";
import type { Book, ShelfStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const ADD_BOOK_ERROR = "Could not add book. Please try again.";

export type ShelfActionState = {
  error?: string;
  success?: string;
  bookId?: string;
};

type CatalogBookInput = {
  title: string;
  author: string | null;
  external_id: string;
  /** ISBNdb cover image URL */
  cover_url?: string;
  /** @deprecated legacy Open Library cover id — ignored for new ISBNdb data */
  cover_i?: string;
  page_count: string;
  isbn?: string;
  first_publish_year?: string;
  first_sentence?: string;
  /** Set when the user picked a specific edition in search (ISBN). */
  edition_key?: string;
};

function seedDescriptionFromSearch(firstSentence?: string): string | null {
  const trimmed = firstSentence?.trim();
  return trimmed || null;
}

async function upsertCatalogBook(
  supabase: SupabaseClient,
  input: CatalogBookInput
): Promise<{ bookId?: string; error?: string }> {
  const {
    title,
    author,
    external_id,
    cover_url: inputCoverUrl,
    page_count,
    isbn,
    first_publish_year,
    first_sentence,
    edition_key,
  } = input;

  if (!title || !external_id) {
    return { error: "Invalid book data." };
  }

  const publishedDate = first_publish_year?.trim() || null;
  const editionSelected = Boolean(edition_key?.trim());
  const trimmedIsbn = isbn?.trim() || external_id;

  const cover_url = await resolveBookCoverUrl({
    coverUrl: inputCoverUrl ?? null,
    isbn: trimmedIsbn,
    title,
    author,
  });

  // Prefer ISBN as the stable catalog key
  const { data: existingByIsbn } = trimmedIsbn
    ? await supabase
        .from("books")
        .select("id, cover_url, isbn, external_source, external_id, page_count")
        .eq("isbn", trimmedIsbn)
        .maybeSingle()
    : { data: null };

  const { data: existingByExternal } = !existingByIsbn
    ? await supabase
        .from("books")
        .select("id, cover_url, isbn, external_source, external_id, page_count")
        .eq("external_source", ISBNDB_SOURCE)
        .eq("external_id", external_id)
        .maybeSingle()
    : { data: null };

  // Also match legacy open_library rows that share this ISBN
  const { data: existingLegacy } =
    !existingByIsbn && !existingByExternal && trimmedIsbn
      ? await supabase
          .from("books")
          .select("id, cover_url, isbn, external_source, external_id, page_count")
          .eq("external_source", "open_library")
          .eq("isbn", trimmedIsbn)
          .maybeSingle()
      : { data: null };

  const existing = existingByIsbn ?? existingByExternal ?? existingLegacy;

  if (existing?.id) {
    const patch: Record<string, unknown> = {
      external_source: ISBNDB_SOURCE,
      external_id,
    };

    if (editionSelected) {
      if (cover_url) patch.cover_url = cover_url;
      if (trimmedIsbn) patch.isbn = trimmedIsbn;
      if (page_count) patch.page_count = Number(page_count);
      if (publishedDate) patch.published_date = publishedDate;
      if (title) patch.title = title;
    } else {
      if (cover_url && (!existing.cover_url || existing.cover_url.includes("covers.openlibrary.org"))) {
        patch.cover_url = cover_url;
      } else if (!existing.cover_url && cover_url) {
        patch.cover_url = cover_url;
      }
      if (trimmedIsbn && !existing.isbn) patch.isbn = trimmedIsbn;
      const parsedPages = page_count ? Number(page_count) : null;
      if (parsedPages && parsedPages > 0 && !existing.page_count) {
        patch.page_count = parsedPages;
      }
    }

    if (Object.keys(patch).length > 0) {
      await supabase.from("books").update(patch).eq("id", existing.id);
    }

    const { data: row } = await supabase.from("books").select("*").eq("id", existing.id).single();
    if (row) {
      await enrichBookCatalogEntry(supabase, row as Book);
    }

    return { bookId: existing.id };
  }

  const seedDescription = seedDescriptionFromSearch(first_sentence);

  const { data: inserted, error: bookError } = await supabase
    .from("books")
    .insert({
      external_source: ISBNDB_SOURCE,
      external_id,
      title,
      author,
      cover_url,
      isbn: trimmedIsbn || null,
      page_count: page_count ? Number(page_count) : null,
      published_date: publishedDate,
      description: seedDescription,
    })
    .select("*")
    .single();

  if (bookError) {
    return { error: bookError.message };
  }

  await enrichBookCatalogEntry(supabase, inserted as Book);

  return { bookId: inserted.id };
}

export async function ensureOpenLibraryBook(
  input: CatalogBookInput
): Promise<ShelfActionState> {
  return ensureCatalogBook(input);
}

export async function ensureCatalogBook(
  input: CatalogBookInput
): Promise<ShelfActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const result = await upsertCatalogBook(supabase, input);
  if (result.error) return { error: result.error };
  return { bookId: result.bookId };
}

export async function addOpenLibraryBookToShelf(
  _prev: ShelfActionState,
  formData: FormData
): Promise<ShelfActionState> {
  return addCatalogBookToShelf(_prev, formData);
}

export async function addCatalogBookToShelf(
  _prev: ShelfActionState,
  formData: FormData
): Promise<ShelfActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const shelfRaw = String(formData.get("shelf_status") ?? "want_to_read");
  if (!isShelfStatus(shelfRaw)) {
    return { error: "Invalid shelf selection." };
  }
  const shelf_status: ShelfStatus = shelfRaw;

  const input: CatalogBookInput = {
    title: String(formData.get("title") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim() || null,
    external_id: String(formData.get("external_id") ?? "").trim(),
    cover_url: String(formData.get("cover_url") ?? "").trim() || undefined,
    cover_i: String(formData.get("cover_i") ?? ""),
    page_count: String(formData.get("page_count") ?? ""),
    isbn: String(formData.get("isbn") ?? "").trim() || undefined,
    first_publish_year: String(formData.get("first_publish_year") ?? "").trim() || undefined,
    first_sentence: String(formData.get("first_sentence") ?? "").trim() || undefined,
    edition_key: String(formData.get("edition_key") ?? "").trim() || undefined,
  };

  const catalog = await upsertCatalogBook(supabase, input);
  if (catalog.error || !catalog.bookId) {
    return { error: ADD_BOOK_ERROR };
  }

  const bookId = catalog.bookId;
  const manualPageCountRaw = String(formData.get("manual_page_count") ?? "").trim();
  const manualPageCount = manualPageCountRaw ? Number(manualPageCountRaw) : null;
  const editionSelected = Boolean(input.edition_key?.trim());

  const { data: existingUserBook } = await supabase
    .from("user_books")
    .select("id, shelf_status, progress_pages, read_count, started_at, is_favorite, rating, completion_tags")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existingUserBook?.shelf_status === shelf_status) {
    return { success: `Already on ${getShelfLabel(shelf_status)}`, bookId };
  }

  const previousShelf = existingUserBook?.shelf_status ?? null;
  const previousPage = Number(existingUserBook?.progress_pages) || 0;
  const now = new Date().toISOString();

  if (shelf_status === "read" && previousShelf !== "read") {
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

    if (shelfError) return { error: ADD_BOOK_ERROR };

    const { data: bookRow } = await supabase
      .from("books")
      .select("id, title, page_count, cover_url, subjects, isbn")
      .eq("id", bookId)
      .maybeSingle();

    const completion = await completeReadingSession({
      supabase,
      userId: user.id,
      bookId,
      userBookId: userBook.id,
      bookTitle: bookRow?.title ?? input.title,
      book: {
        id: bookId,
        page_count: bookRow?.page_count ?? (input.page_count ? Number(input.page_count) : null),
        cover_url: bookRow?.cover_url ?? null,
        subjects: bookRow?.subjects ?? null,
        isbn: bookRow?.isbn ?? input.isbn ?? null,
      },
      editionSelected: Boolean(input.edition_key?.trim() || input.isbn?.trim()),
      previousPage,
      readNumber: Number(existingUserBook?.read_count) || 1,
      finishedAt: now,
      startedAt: userBook.started_at ?? now,
      manualPageCount,
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

    if (completion.resolution) {
      trackReadingCompleted({
        source: "search_add",
        bookId,
        pageCountStatus: completion.resolution.pageCountStatus,
        pageCountSource: completion.resolution.pageCountSource,
        pagesRead:
          completion.resolution.pageCountStatus === "missing"
            ? null
            : completion.resolution.totalPages,
      });
    }

    const label = getShelfLabel(shelf_status);
    const action = existingUserBook ? "Moved to" : "Added to";
    return { success: `${action} ${label}`, bookId };
  }

  const { data: userBook, error: shelfError } = await supabase
    .from("user_books")
    .upsert(
      {
        user_id: user.id,
        book_id: bookId,
        shelf_status,
        updated_at: now,
      },
      { onConflict: "user_id,book_id" }
    )
    .select("id")
    .single();

  if (shelfError) {
    return { error: ADD_BOOK_ERROR };
  }

  const event_type = existingUserBook ? "shelf_updated" : "book_added";

  const { data: bookRow } = await supabase
    .from("books")
    .select("id, cover_url, subjects")
    .eq("id", bookId)
    .maybeSingle();

  await recordActivity(supabase, {
    user_id: user.id,
    event_type,
    entity_type: "user_book",
    entity_id: userBook?.id ?? null,
    metadata_json: activityMetadata(input.title, {
      ...bookActivityContext(bookRow ?? { id: bookId }),
      shelf_status,
      external_source: ISBNDB_SOURCE,
      external_id: input.external_id,
      previous_shelf_status: previousShelf,
    }),
  });

  const label = getShelfLabel(shelf_status);
  const action = existingUserBook ? "Moved to" : "Added to";
  return {
    success: `${action} ${label}`,
    bookId,
  };
}
