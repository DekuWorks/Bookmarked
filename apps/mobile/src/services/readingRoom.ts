import { supabase } from "./supabase";
import type { Book, Review } from "../types";

export type UserReviewWithBook = Review & {
  books: Pick<Book, "id" | "title" | "author" | "cover_url"> | null;
};

/** Mirrors apps/web/src/lib/services/readingRoom.ts listUserReviews. */
export async function listUserReviews(
  userId: string,
  limit = 50
): Promise<UserReviewWithBook[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, books(id, title, author, cover_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[readingRoom] list user reviews failed:", error);
    return [];
  }

  return (data ?? []) as UserReviewWithBook[];
}
