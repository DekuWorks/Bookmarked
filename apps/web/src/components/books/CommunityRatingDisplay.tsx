import { StarDisplay } from "@/components/reviews/StarDisplay";
import type { CommunityRating } from "@/lib/services/communityRatings";
import { cn } from "@/lib/utils/cn";

type Props = {
  rating: CommunityRating;
  className?: string;
};

export function CommunityRatingDisplay({ rating, className }: Props) {
  const countLabel =
    rating.ratingCount === 1 ? "1 rating" : `${rating.ratingCount} ratings`;

  return (
    <div
      className={cn("inline-flex flex-wrap items-center justify-center gap-2", className)}
      aria-label={`Community rating ${rating.averageRating} based on ${countLabel}`}
    >
      <StarDisplay rating={rating.averageRating} showNumeric />
      <span className="text-text-muted">based on {countLabel}</span>
    </div>
  );
}
