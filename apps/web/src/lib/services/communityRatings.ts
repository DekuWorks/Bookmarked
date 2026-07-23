import { createClient } from "@/lib/supabase/client";
import {
  aggregateRatingsByBook,
  computeAverageRating,
  type CommunityRating,
} from "../../../../../packages/utils";

export type { CommunityRating };

export async function getCommunityRating(bookId: string): Promise<CommunityRating | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("book_id", bookId)
    .eq("visibility", "public")
    .not("rating", "is", null);

  if (error) throw error;
  if (!data?.length) return null;

  return computeAverageRating(data.map((row) => Number(row.rating)));
}

export async function getCommunityRatingsForBooks(
  bookIds: string[]
): Promise<Map<string, CommunityRating>> {
  const unique = [...new Set(bookIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("book_id, rating")
    .in("book_id", unique)
    .eq("visibility", "public")
    .not("rating", "is", null);

  if (error) throw error;

  return aggregateRatingsByBook(
    (data ?? []).map((row) => ({
      book_id: row.book_id as string,
      rating: Number(row.rating),
    }))
  );
}
