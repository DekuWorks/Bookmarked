import Image from "next/image";
import {
  BRAND_ASSETS,
  type SavedBookBadgeSize,
} from "@/lib/constants/brandAssets";
import { cn } from "@/lib/utils/cn";

const sizeClass: Record<SavedBookBadgeSize, string> = {
  small: "w-[18%] min-w-[0.875rem] max-w-[1.125rem]",
  medium: "w-[22%] min-w-[1.125rem] max-w-[1.75rem]",
  large: "w-[28%] min-w-[1.375rem] max-w-[2.25rem]",
};

type Props = {
  className?: string;
  size?: SavedBookBadgeSize;
};

/**
 * Saved-book bookmark badge — lavender ribbon with purple B and sparkles.
 * Parent must not clip overflow so sparkles render outside cover bounds.
 */
export function SavedBookBadge({ className, size = "medium" }: Props) {
  const { aspectRatio } = BRAND_ASSETS.savedBadge;

  return (
    <div
      className={cn(
        "pointer-events-none absolute right-0 top-0 z-20 overflow-visible",
        sizeClass[size],
        className
      )}
      style={{ aspectRatio }}
      role="img"
      aria-label={BRAND_ASSETS.savedBadge.accessibilityLabel}
    >
      <Image
        src={BRAND_ASSETS.savedBadge.src}
        alt=""
        fill
        className="object-contain object-right-top"
        sizes="2rem"
        unoptimized
      />
    </div>
  );
}
