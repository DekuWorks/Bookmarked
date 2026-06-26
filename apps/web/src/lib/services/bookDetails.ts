import { createClient } from "@/lib/supabase/client";
import { enrichBookFromOpenLibrary } from "@/lib/services/bookMetadata";
import { resolveBookCoverUrl } from "@/lib/services/covers";
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

  let enriched = await enrichBookFromOpenLibrary(supabase, book as Book);

  if (!enriched.cover_url) {
    const resolved = await resolveBookCoverUrl({
      coverUrl: enriched.cover_url,
      isbn: enriched.isbn,
      title: enriched.title,
      author: enriched.author,
    });
    if (resolved) {
      const { data: updated } = await supabase
        .from("books")
        .update({ cover_url: resolved })
        .eq("id", bookId)
        .select("*")
        .single();
      if (updated) enriched = updated as Book;
    }
  }

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
