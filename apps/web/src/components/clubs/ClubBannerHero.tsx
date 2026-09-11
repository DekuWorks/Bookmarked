"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useCoverPalette } from "@/lib/hooks/useCoverPalette";
import {
  BOOK_CLUB_DEFAULT_BANNER_GRADIENT,
  type ResolvedClubBanner,
} from "@bookmarked/utils/clubBanner";
import { cn } from "@/lib/utils/cn";

type Props = {
  banner: ResolvedClubBanner;
  className?: string;
  /** Overlay content (club name, metadata) rendered over the scrim. */
  children?: ReactNode;
};

/**
 * Club header banner.
 * - custom: uploaded/custom image (or brand gradient)
 * - current_read: cover-derived colour wash when sampling works; otherwise cover image / brand gradient
 * Always applies a bottom scrim so overlaid text stays readable.
 */
export function ClubBannerHero({ banner, className, children }: Props) {
  const coverForPalette =
    banner.mode === "current_read" && banner.kind === "image" ? banner.url : null;
  const palette = useCoverPalette(coverForPalette);
  const brand = BOOK_CLUB_DEFAULT_BANNER_GRADIENT;

  return (
    <div className={cn("relative h-44 w-full overflow-hidden sm:h-52", className)}>
      {banner.mode === "current_read" && palette && coverForPalette ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.washTop} 52%, ${palette.washBottom} 100%)`,
            }}
            aria-hidden
          />
          <Image
            src={coverForPalette}
            alt=""
            fill
            className="object-cover opacity-45 mix-blend-overlay scale-110"
            unoptimized
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </>
      ) : banner.kind === "image" ? (
        <Image
          src={banner.url}
          alt=""
          fill
          className="object-cover"
          unoptimized
          sizes="(max-width: 768px) 100vw, 768px"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, ${brand.from}, ${brand.via}, ${brand.to})`,
          }}
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/15"
        aria-hidden
      />
      {children ? (
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4 pt-12 sm:px-6 sm:pb-5">
          {children}
        </div>
      ) : null}
    </div>
  );
}
