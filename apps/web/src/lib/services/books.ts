"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { openLibraryCoverUrl } from "@/lib/services/openLibrary";
import type { ShelfStatus } from "@/types";

export type ShelfActionState = {
  error?: string;
  success?: string;
};

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

  const shelf_status = String(formData.get("shelf_status") ?? "want_to_read") as ShelfStatus;
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim() || null;
  const external_id = String(formData.get("external_id") ?? "").trim();
  const cover_i = formData.get("cover_i");
  const page_count = formData.get("page_count");

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

  let bookId = existing?.id;

  if (!bookId) {
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
    bookId = inserted.id;
  }

  const { error: shelfError } = await supabase.from("user_books").upsert(
    {
      user_id: user.id,
      book_id: bookId,
      shelf_status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,book_id" }
  );

  if (shelfError) {
    return { error: shelfError.message };
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");
  return { success: `Added to ${shelf_status.replace(/_/g, " ")}.` };
}
