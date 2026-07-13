import { supabase } from "./supabase";
import { getBookReviews } from "./reviews";
import { listReadingSessions } from "./readingSessions";
import { listNotesByBook } from "./readingNotes";
import type { Book, ReadingNote, ReadingSession, Review, UserBook } from "../types";

/**
 * Mobile book details service. Mirrors apps/web/src/lib/services/bookDetails.ts:
 * loads the shared `books` row plus the viewer's user_book, reviews, community
 * rating, reading sessions, and reading notes.
 */

export type CommunityRating = { averageRating: number; ratingCount: number };

export type BookDetailsData = {
  book: Book;
  userBook: UserBook | null;
  reviews: Review[];
  ownReviews: Review[];
  communityRating: CommunityRating | null;
  readingSessions: ReadingSession[];
  notes: ReadingNote[];
};

async function getCommunityRating(bookId: string): Promise<CommunityRating | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("book_id", bookId)
    .eq("visibility", "public")
    .not("rating", "is", null);

  if (error) throw error;
  if (!data?.length) return null;

  const sum = data.reduce((acc, row) => acc + Number(row.rating), 0);
  return {
    averageRating: Math.round((sum / data.length) * 10) / 10,
    ratingCount: data.length,
  };
}

export async function getBookDetails(
  bookId: string,
  userId: string
): Promise<BookDetailsData | null> {
  const { data: book, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (error) throw error;
  if (!book) return null;

  const [{ data: userBook }, reviews, communityRating] = await Promise.all([
    supabase
      .from("user_books")
      .select("*")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle(),
    getBookReviews(bookId),
    getCommunityRating(bookId),
  ]);

  const typedUserBook = (userBook as UserBook | null) ?? null;
  const [readingSessions, notes] = await Promise.all([
    typedUserBook ? listReadingSessions(typedUserBook.id) : Promise.resolve([]),
    typedUserBook ? listNotesByBook(typedUserBook.id) : Promise.resolve([]),
  ]);

  return {
    book: book as Book,
    userBook: typedUserBook,
    reviews,
    ownReviews: reviews.filter((r) => r.user_id === userId),
    communityRating,
    readingSessions,
    notes,
  };
}
