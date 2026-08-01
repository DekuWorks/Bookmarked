"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getShelfIconConfig,
  SHELF_ICON_FRAME_PX,
  SHELF_ICON_SIZE_PX,
  type ShelfIconId,
  type ShelfIconSize,
} from "@/lib/constants/shelfIcons";
import { cn } from "@/lib/utils/cn";

type Props = {
  id: ShelfIconId;
  size?: ShelfIconSize;
  className?: string;
  /** When true, exposes the shelf name to assistive tech (default: decorative). */
  labeled?: boolean;
  /** Subtle entrance fade when mounted (respects prefers-reduced-motion). */
  animate?: boolean;
};

export function ShelfIcon({
  id,
  size = "small",
  className,
  labeled = false,
  animate = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const config = getShelfIconConfig(id);
  const px = SHELF_ICON_SIZE_PX[size];
  const frame = SHELF_ICON_FRAME_PX[size];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 shadow-none",
        animate &&
          "motion-safe:opacity-0 motion-safe:animate-[shelf-icon-in_200ms_ease-out_forwards]",
        className
      )}
      style={{ width: frame, height: frame }}
      role={labeled ? "img" : undefined}
      aria-label={labeled ? config.accessibilityLabel : undefined}
      aria-hidden={!labeled}
    >
      {!loaded && !error ? (
        <span
          className="block animate-pulse bg-transparent opacity-40"
          style={{ width: px, height: px }}
          aria-hidden
        />
      ) : null}
      {error ? (
        <span className="block bg-transparent" style={{ width: px, height: px }} aria-hidden />
      ) : (
        <Image
          src={config.src}
          alt={labeled ? config.accessibilityLabel : ""}
          width={px}
          height={px}
          className={cn(
            "object-contain dark:brightness-110",
            !loaded && "absolute opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          unoptimized
        />
      )}
    </span>
  );
}
