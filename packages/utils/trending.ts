/** Weight activity events so finishes and reviews rank above casual shelves. */
export const TRENDING_ACTIVITY_WEIGHTS = {
  book_finished: 3,
  review_created: 2,
  book_added: 1,
} as const;

export type TrendingActivityEventType = keyof typeof TRENDING_ACTIVITY_WEIGHTS;

export function addWeightedActivityCount(
  counts: Map<string, number>,
  bookId: string,
  eventType: TrendingActivityEventType
): void {
  const weight = TRENDING_ACTIVITY_WEIGHTS[eventType];
  counts.set(bookId, (counts.get(bookId) ?? 0) + weight);
}

/** Blend weekly shelves, reviews, and weighted activity into a composite score. */
export function blendTrendingScore(
  bookId: string,
  activityCounts: Map<string, number>,
  shelvedCounts: Map<string, number>,
  reviewCounts: Map<string, number>
): number {
  const activity = activityCounts.get(bookId) ?? 0;
  const shelved = shelvedCounts.get(bookId) ?? 0;
  const reviewed = reviewCounts.get(bookId) ?? 0;
  return activity + shelved * 0.5 + reviewed * 0.75;
}
