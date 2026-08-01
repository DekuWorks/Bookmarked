"use client";

import Image from "next/image";
import {
  BRAND_ASSETS,
  type SavedBookBadgeSize,
} from "@/lib/constants/brandAssets";
import { Z_LAYERS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";

const sizeClass: Record<SavedBookBadgeSize, string> = {
  small: "w-[16%] min-w-[1rem] max-w-[1.375rem]",
  medium: "w-[18%] min-w-[1.375rem] max-w-[2.25rem]",
  large: "w-[20%] min-w-[1.75rem] max-w-[2.75rem]",
};

/** Flush to cover top-left — no inset so the ribbon reads as hanging off the edge. */
export const SAVED_BOOK_BADGE_INSET = "0";
/** Layer above cover art; below interactive menus (see Z_LAYERS in lib/constants/zIndex). */
export const SAVED_BOOK_BADGE_Z = Z_LAYERS.raisedContent;

type Props = {
  /** When false, badge is hidden. */
  isSaved?: boolean;
  /** Optional toggle handler — makes the badge a keyboard-focusable control. */
  onToggle?: () => void;
  className?: string;
  size?: SavedBookBadgeSize;
};

/**
 * Saved-book bookmark badge — flush top-left of the cover, above the artwork.
 * Artwork unchanged. Parent must allow overflow so the ribbon stays fully visible.
 *
 * Labels:
 * - Decorative saved: "Saved to Bookmarked"
 * - Interactive saved: "Remove from saved books"
 * - Interactive unsaved: "Save book" (badge hidden until saved in current product UX)
 */
export function SavedBookBadge({
  isSaved = true,
  onToggle,
  className,
  size = "medium",
}: Props) {
  const { aspectRatio } = BRAND_ASSETS.savedBadge;

  if (!isSaved) return null;

  const label = onToggle
    ? "Remove from saved books"
    : BRAND_ASSETS.savedBadge.accessibilityLabel;

  const body = (
    <Image
      src={BRAND_ASSETS.savedBadge.src}
      alt=""
      fill
      className="object-contain object-left-top"
      sizes="2rem"
      unoptimized
    />
  );

  const positionClass = cn(
    "absolute overflow-visible",
    sizeClass[size],
    className
  );
  const positionStyle = {
    aspectRatio,
    top: SAVED_BOOK_BADGE_INSET,
    left: SAVED_BOOK_BADGE_INSET,
    zIndex: SAVED_BOOK_BADGE_Z,
  } as const;

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
        className={cn(
          positionClass,
          "min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        )}
        style={positionStyle}
        aria-label={label}
        aria-pressed={isSaved}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      className={cn(positionClass, "pointer-events-none")}
      style={positionStyle}
      role="img"
      aria-label={label}
    >
      {body}
    </div>
  );
}
