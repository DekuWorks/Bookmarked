import { cn } from "@/lib/utils/cn";
import { formatStarRating } from "@/lib/utils/ratings";
import { STAR_RATING_ROW_CLASS, starFills } from "@bookmarked/utils/starRatingDisplay";

type Props = {
  rating: number;
  className?: string;
  showNumeric?: boolean;
};

export function StarDisplay({ rating, className, showNumeric = false }: Props) {
  const fills = starFills(rating);

  return (
    <span className={cn("inline-flex items-center gap-1 text-royal-orange", className)}>
      <span className={cn(STAR_RATING_ROW_CLASS, "shrink-0")} aria-hidden>
        {fills.map((fill, index) => (
          <span key={index} className="relative inline-block w-[1em] shrink-0 text-center">
            <span className="text-border">☆</span>
            {fill !== "empty" ? (
              <span
                className={cn(
                  "absolute inset-0 text-royal-orange",
                  fill === "half" && "[clip-path:inset(0_50%_0_0)]"
                )}
              >
                ★
              </span>
            ) : null}
          </span>
        ))}
      </span>
      {showNumeric ? (
        <span className="text-sm font-medium text-text">{formatStarRating(Number(rating) || 0)}</span>
      ) : null}
    </span>
  );
}
