import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg";

/** Ribbon width as a fraction of cover width (trimmed asset is ~282×477). */
const sizeClass: Record<Size, string> = {
  sm: "w-[18%] min-w-[0.875rem] max-w-[1.125rem]",
  md: "w-[22%] min-w-[1.125rem] max-w-[1.75rem]",
  lg: "w-[28%] min-w-[1.375rem] max-w-[2.25rem]",
};

type Props = {
  className?: string;
  size?: Size;
};

/**
 * Bookmark ribbon for shelved books — lavender ribbon with purple B + sparkles,
 * positioned at the top-right of covers.
 *
 * ## Bookmark overlay replacement (pending design approval)
 * When the larger-sparkles bookmark overlay asset is approved, replace:
 * - Web: `apps/web/public/images/bookmark-ribbon.png`
 * - Mobile: `apps/mobile/assets/brand/bookmark-ribbon.png`
 * No component API changes are required — `BookmarkedShelfBadge` reads from those paths.
 */
export function BookmarkedShelfBadge({ className, size = "md" }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-0 top-0 z-20 aspect-[282/477]",
        sizeClass[size],
        className
      )}
      aria-hidden
    >
      <Image
        src="/images/bookmark-ribbon.png?v=3"
        alt=""
        fill
        className="object-contain object-right-top"
        sizes="2rem"
        unoptimized
      />
    </div>
  );
}
