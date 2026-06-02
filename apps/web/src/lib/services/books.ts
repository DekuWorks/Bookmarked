"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getShelfLabel, isShelfStatus } from "@/lib/constants/shelfLabels";
import { openLibraryCoverUrl } from "@/lib/services/openLibrary";
import type { ShelfStatus } from "@/types";

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
};

function revalidateLibraryPaths() {
  revalidatePath("/library");
  revalidatePath("/library/want-to-read");
  revalidatePath("/library/reading");
  revalidatePath("/library/read");
  revalidatePath("/dashboard");
}

async function upsertOpenLibraryCatalogBook(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: OpenLibraryBookInput
): Promise<{ bookId?: string; error?: string }> {
  const { title, author, external_id, cover_i, page_count } = input;

  if (!title || !external_id) {
    return { error: "Invalid book data." };
  }

  const cover_url = cover_i ? openLibraryCoverUrl(Number(cover_i)) : null;

  const { data: existing } = await supabase
    .from("books")
    .select("id")
    .eq("external_source", "open_library")
    .eq("external_id", external_id)
    .maybeSingle();

  if (existing?.id) {
    return { bookId: existing.id };
  }

  const { data: inserted, error: bookError } = await supabase
    .from("books")
    .insert({
      external_source: "open_library",
      external_id,
      title,
      author,
      cover_url,
      page_count: page_count ? Number(page_count) : null,
    })
    .select("id")
    .single();

  if (bookError) {
    return { error: bookError.message };
  }

  return { bookId: inserted.id };
}

export async function ensureOpenLibraryBook(
  input: OpenLibraryBookInput
): Promise<ShelfActionState> {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  };

  const catalog = await upsertOpenLibraryCatalogBook(supabase, input);
  if (catalog.error || !catalog.bookId) {
    return { error: catalog.error ?? "Could not save book." };
  }

  const bookId = catalog.bookId;

  const { data: existingUserBook } = await supabase
    .from("user_books")
    .select("id, shelf_status")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existingUserBook?.shelf_status === shelf_status) {
    revalidateLibraryPaths();
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
    return { error: shelfError.message };
  }

  const event_type = existingUserBook ? "shelf_updated" : "book_added";

  await supabase.from("activity_events").insert({
    user_id: user.id,
    event_type,
    entity_type: "user_book",
    entity_id: userBook?.id ?? null,
    metadata_json: {
      book_title: input.title,
      shelf_status,
      external_source: "open_library",
      external_id: input.external_id,
      previous_shelf_status: existingUserBook?.shelf_status ?? null,
    },
  });

  revalidateLibraryPaths();

  const action = existingUserBook ? "Moved to" : "Added to";
  return {
    success: `${action} ${getShelfLabel(shelf_status)}`,
    bookId,
  };
}
