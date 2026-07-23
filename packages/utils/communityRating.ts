export type CommunityRating = {
  averageRating: number;
  ratingCount: number;
};

export function formatRatingCount(count: number): string {
  return count === 1 ? "1 rating" : `${count} ratings`;
}

export function computeAverageRating(ratings: number[]): CommunityRating | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return {
    averageRating: Math.round((sum / ratings.length) * 10) / 10,
    ratingCount: ratings.length,
  };
}

export function aggregateRatingsByBook(
  rows: ReadonlyArray<{ book_id: string; rating: number }>
): Map<string, CommunityRating> {
  const buckets = new Map<string, number[]>();
  for (const row of rows) {
    const list = buckets.get(row.book_id) ?? [];
    list.push(row.rating);
    buckets.set(row.book_id, list);
  }

  const result = new Map<string, CommunityRating>();
  for (const [bookId, ratings] of buckets) {
    const rating = computeAverageRating(ratings);
    if (rating) result.set(bookId, rating);
  }
  return result;
}
