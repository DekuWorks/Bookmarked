import { cn } from "@/lib/utils/cn";
import type { BookBadge } from "@/lib/services/bookBadges";

type Props = {
  badges: BookBadge[];
  className?: string;
  size?: "sm" | "md";
};

export function BookTrendBadge({ badges, className, size = "sm" }: Props) {
  if (!badges.length) return null;

  const text = size === "sm" ? "text-[10px]" : "text-xs";
  const pad = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {badges.map((badge) => (
        <span
          key={badge.type}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full bg-puce-red/90 font-semibold text-white shadow-sm",
            text,
            pad
          )}
        >
          <span aria-hidden>{badge.emoji}</span>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
