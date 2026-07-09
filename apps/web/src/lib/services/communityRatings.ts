import { createClient } from "@/lib/supabase/client";

export type CommunityRating = {
  averageRating: number;
  ratingCount: number;
};

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

  const sum = data.reduce((acc, row) => acc + Number(row.rating), 0);
  return {
    averageRating: Math.round((sum / data.length) * 10) / 10,
    ratingCount: data.length,
  };
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

  const buckets = new Map<string, number[]>();
  for (const row of data ?? []) {
    const id = row.book_id as string;
    const list = buckets.get(id) ?? [];
    list.push(Number(row.rating));
    buckets.set(id, list);
  }

  const result = new Map<string, CommunityRating>();
  for (const [bookId, ratings] of buckets) {
    const sum = ratings.reduce((a, b) => a + b, 0);
    result.set(bookId, {
      averageRating: Math.round((sum / ratings.length) * 10) / 10,
      ratingCount: ratings.length,
    });
  }
  return result;
}
