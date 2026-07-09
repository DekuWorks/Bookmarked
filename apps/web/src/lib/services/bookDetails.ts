import { createClient } from "@/lib/supabase/client";
import { enrichBookCatalogEntry } from "@/lib/services/bookMetadata";
import { getCommunityRating, type CommunityRating } from "@/lib/services/communityRatings";
import { getBookBadges, type BookBadge } from "@/lib/services/bookBadges";
import { listReadingSessions } from "@/lib/services/readingSessions";
import type { Book, ReadingSession, Review, UserBook } from "@/types";

export type BookDetailsData = {
  book: Book;
  userBook: UserBook | null;
  reviews: Review[];
  ownReviews: Review[];
  communityRating: CommunityRating | null;
  badges: BookBadge[];
  readingSessions: ReadingSession[];
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

  const [{ data: userBook }, { data: reviews }, communityRating, badges] = await Promise.all([
    supabase.from("user_books").select("*").eq("user_id", userId).eq("book_id", bookId).maybeSingle(),
    supabase
      .from("reviews")
      .select("*, profiles(display_name, username)")
      .eq("book_id", bookId)
      .order("read_number", { ascending: false })
      .order("created_at", { ascending: false }),
    getCommunityRating(bookId),
    getBookBadges(bookId),
  ]);

  const reviewList = (reviews ?? []) as Review[];
  const ownReviews = reviewList.filter((r) => r.user_id === userId);

  const readingSessions = userBook
    ? await listReadingSessions(userBook.id)
    : [];

  return {
    book: enriched,
    userBook: (userBook as UserBook | null) ?? null,
    reviews: reviewList,
    ownReviews,
    communityRating,
    badges,
    readingSessions,
  };
}
