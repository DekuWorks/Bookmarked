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

/** Owner-only private reviews. RLS still requires user_id = auth user. */
export async function listPrivateUserReviews(
  userId: string,
  limit = 50
): Promise<UserReviewWithBook[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, books(id, title, author, cover_url)")
    .eq("user_id", userId)
    .eq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[readingRoom] list private user reviews failed:", error);
    return [];
  }

  return (data ?? []) as UserReviewWithBook[];
}

/** Public-only reviews for reader profiles. Explicitly filter visibility even
 * though RLS also protects private rows. */
export async function listPublicUserReviews(
  userId: string,
  limit = 50
): Promise<UserReviewWithBook[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, books(id, title, author, cover_url)")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[readingRoom] list public user reviews failed:", error);
    return [];
  }

  return (data ?? []) as UserReviewWithBook[];
}
