"use client";

import Image from "next/image";
import { useCoverPalette } from "@/lib/hooks/useCoverPalette";
import {
  BOOK_CLUB_DEFAULT_BANNER_GRADIENT,
  type ResolvedClubBanner,
} from "@bookmarked/utils/clubBanner";

type Props = {
  banner: ResolvedClubBanner;
  className?: string;
};

/**
 * Club header banner.
 * - custom: uploaded/custom image (or brand gradient)
 * - current_read: cover-derived colour wash when sampling works; otherwise cover image / brand gradient
 */
export function ClubBannerHero({ banner, className }: Props) {
  const coverForPalette =
    banner.mode === "current_read" && banner.kind === "image" ? banner.url : null;
  const palette = useCoverPalette(coverForPalette);
  const brand = BOOK_CLUB_DEFAULT_BANNER_GRADIENT;

  return (
    <div className={className ?? "relative h-36 w-full sm:h-44"}>
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
            className="object-cover opacity-40 mix-blend-overlay"
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
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10"
        aria-hidden
      />
    </div>
  );
}
