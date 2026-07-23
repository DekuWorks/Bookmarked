"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BRAND_ASSETS,
  BRAND_LOGO_SIZE_PX,
  getBrandLogoDimensions,
  type BrandLogoSize,
} from "@/lib/constants/brandAssets";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  /** Show only the B mark (compact nav). */
  compact?: boolean;
  size?: BrandLogoSize;
  priority?: boolean;
};

/**
 * Official Bookmarked wordmark or compact B mark.
 * Falls back to plain text "Bookmarked" if the image fails to load.
 */
export function BookmarkedLogo({
  className,
  compact = false,
  size = "medium",
  priority = false,
}: Props) {
  const [imageError, setImageError] = useState(false);
  const height = BRAND_LOGO_SIZE_PX[size];

  if (compact) {
    if (imageError) {
      return (
        <span className={cn("shrink-0 text-sm font-bold text-puce-red", className)} aria-hidden>
          B
        </span>
      );
    }

    return (
      <Image
        src={BRAND_ASSETS.logoMark.src}
        alt=""
        width={height}
        height={height}
        className={cn("shrink-0", className)}
        unoptimized
        aria-hidden
        onError={() => setImageError(true)}
      />
    );
  }

  if (imageError) {
    return (
      <span className={cn("shrink-0 text-lg font-bold text-puce-red", className)}>
        Bookmarked
      </span>
    );
  }

  const { width } = getBrandLogoDimensions(size);

  return (
    <Image
      src={BRAND_ASSETS.logoHorizontal.src}
      alt={BRAND_ASSETS.logoHorizontal.alt}
      width={width}
      height={height}
      className={cn("shrink-0 dark:brightness-110", className)}
      unoptimized
      priority={priority}
      onError={() => setImageError(true)}
    />
  );
}
