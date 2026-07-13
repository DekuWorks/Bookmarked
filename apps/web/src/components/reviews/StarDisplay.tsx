import { cn } from "@/lib/utils/cn";
import { formatStarRating } from "@/lib/utils/ratings";

type Props = {
  rating: number;
  className?: string;
  showNumeric?: boolean;
};

function starFill(value: number, star: number): "full" | "half" | "empty" {
  if (value >= star) return "full";
  if (value >= star - 0.5) return "half";
  return "empty";
}

export function StarDisplay({ rating, className, showNumeric = false }: Props) {
  const value = Number(rating) || 0;

  return (
    <span className={cn("inline-flex items-center gap-1 text-royal-orange", className)}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = starFill(value, star);
          return (
            <span key={star} className="relative inline-block w-[1em] text-center">
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
          );
        })}
      </span>
      {showNumeric ? (
        <span className="text-sm font-medium text-text">{formatStarRating(value)}</span>
      ) : null}
    </span>
  );
}
