import { createClient } from "@/lib/supabase/client";
import { getShelfLabel, isShelfStatus } from "@/lib/constants/shelfLabels";
import { activityMetadata, bookActivityContext, recordActivity } from "@/lib/services/activity";
import { enrichBookCatalogEntry } from "@/lib/services/bookMetadata";
import { resolveBookCoverUrl } from "@/lib/services/covers";
import type { Book, ShelfStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const ADD_BOOK_ERROR = "Could not add book. Please try again.";

export type ShelfActionState = {
  error?: string;
  success?: string;
  bookId?: string;
};

type OpenLibraryBookInput = {
  title: string;
  author: string | null;
  external_id: string;
  cover_i: string;
  page_count: string;
  isbn?: string;
  first_publish_year?: string;
  first_sentence?: string;
};

function seedDescriptionFromSearch(firstSentence?: string): string | null {
  const trimmed = firstSentence?.trim();
  return trimmed || null;
}

async function upsertOpenLibraryCatalogBook(
  supabase: SupabaseClient,
  input: OpenLibraryBookInput
): Promise<{ bookId?: string; error?: string }> {
  const { title, author, external_id, cover_i, page_count, isbn, first_publish_year, first_sentence } =
    input;

  if (!title || !external_id) {
    return { error: "Invalid book data." };
  }

  const publishedDate = first_publish_year?.trim() || null;

  const cover_url = await resolveBookCoverUrl({
    coverId: cover_i ? Number(cover_i) : null,
    isbn: isbn ?? null,
    title,
    author,
  });

  const { data: existing } = await supabase
    .from("books")
    .select("id, cover_url")
    .eq("external_source", "open_library")
    .eq("external_id", external_id)
    .maybeSingle();

  if (existing?.id) {
    const patch: Record<string, unknown> = {};
    if (!existing.cover_url && cover_url) patch.cover_url = cover_url;

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
      external_source: "open_library",
      external_id,
      title,
      author,
      cover_url,
      isbn: isbn?.trim() || null,
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
  input: OpenLibraryBookInput
): Promise<ShelfActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const result = await upsertOpenLibraryCatalogBook(supabase, input);
  if (result.error) return { error: result.error };
  return { bookId: result.bookId };
}

export async function addOpenLibraryBookToShelf(
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

  const input: OpenLibraryBookInput = {
    title: String(formData.get("title") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim() || null,
    external_id: String(formData.get("external_id") ?? "").trim(),
    cover_i: String(formData.get("cover_i") ?? ""),
    page_count: String(formData.get("page_count") ?? ""),
    isbn: String(formData.get("isbn") ?? "").trim() || undefined,
    first_publish_year: String(formData.get("first_publish_year") ?? "").trim() || undefined,
    first_sentence: String(formData.get("first_sentence") ?? "").trim() || undefined,
  };

  const catalog = await upsertOpenLibraryCatalogBook(supabase, input);
  if (catalog.error || !catalog.bookId) {
    return { error: ADD_BOOK_ERROR };
  }

  const bookId = catalog.bookId;

  const { data: existingUserBook } = await supabase
    .from("user_books")
    .select("id, shelf_status")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existingUserBook?.shelf_status === shelf_status) {
    return { success: `Already on ${getShelfLabel(shelf_status)}`, bookId };
  }

  const { data: userBook, error: shelfError } = await supabase
    .from("user_books")
    .upsert(
      {
        user_id: user.id,
        book_id: bookId,
        shelf_status,
        updated_at: new Date().toISOString(),
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
      external_source: "open_library",
      external_id: input.external_id,
      previous_shelf_status: existingUserBook?.shelf_status ?? null,
    }),
  });

  const label = getShelfLabel(shelf_status);
  const action = existingUserBook ? "Moved to" : "Added to";
  return {
    success: `${action} ${label}`,
    bookId,
  };
}
