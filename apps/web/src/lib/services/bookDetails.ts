import { createClient } from "@/lib/supabase/client";
import { fetchOpenLibraryWorkDetails } from "@/lib/services/openLibrary";
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

  let enriched = book as Book;

  if (
    book.external_source === "open_library" &&
    book.external_id &&
    (!book.description || !book.subjects?.length)
  ) {
    const ol = await fetchOpenLibraryWorkDetails(book.external_id);
    if (ol) {
      const updates: Partial<Book> = {};
      if (!book.description && ol.description) updates.description = ol.description;
      if (!book.subjects?.length && ol.subjects.length) updates.subjects = ol.subjects;
      if (!book.published_date && ol.published_date) updates.published_date = ol.published_date;
      if (!book.publisher && ol.publisher) updates.publisher = ol.publisher;
      if (!book.page_count && ol.page_count) updates.page_count = ol.page_count;

      if (Object.keys(updates).length > 0) {
        const { data: updated } = await supabase
          .from("books")
          .update(updates)
          .eq("id", bookId)
          .select("*")
          .single();
        if (updated) enriched = updated as Book;
      }
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
