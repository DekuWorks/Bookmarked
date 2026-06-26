import { createClient } from "@/lib/supabase/client";
import { enrichBookCatalogEntry } from "@/lib/services/bookMetadata";
import type { Book, Review, UserBook } from "@/types";

export type BookDetailsData = {
  book: Book;
  userBook: UserBook | null;
  reviews: Review[];
  ownReview: Review | null;
};

export async function getBookDetails(
  bookId: string,
  userId: string
): Promise<BookDetailsData | null> {
  const supabase = createClient();

  const { data: book, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (error) throw error;
  if (!book) return null;

  const enriched = await enrichBookCatalogEntry(supabase, book as Book);

  const { data: userBook } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles(display_name, username)")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  const reviewList = (reviews ?? []) as Review[];
  const ownReview = reviewList.find((r) => r.user_id === userId) ?? null;

  return {
    book: enriched,
    userBook: (userBook as UserBook | null) ?? null,
    reviews: reviewList,
    ownReview,
  };
}
