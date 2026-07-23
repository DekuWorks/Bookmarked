import { StarDisplay } from "@/components/reviews/StarDisplay";
import type { CommunityRating } from "@/lib/services/communityRatings";
import { formatRatingCount } from "../../../../../packages/utils";
import { cn } from "@/lib/utils/cn";

type Props = {
  rating: CommunityRating;
  className?: string;
};

export function CommunityRatingDisplay({ rating, className }: Props) {
  const countLabel = formatRatingCount(rating.ratingCount);

  return (
    <div
      className={cn("inline-flex flex-wrap items-center justify-center gap-2", className)}
      aria-label={`Bookmarked rating ${rating.averageRating} based on ${countLabel}`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Bookmarked rating
      </span>
      <StarDisplay rating={rating.averageRating} showNumeric />
      <span className="text-text-muted">({countLabel})</span>
    </div>
  );
}
