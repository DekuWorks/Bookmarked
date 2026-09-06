"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getCustomShelfA11yLabel,
  getCustomShelfIconFallbackSrc,
  getCustomShelfIconSrc,
  getShelfIconConfig,
  SHELF_ICON_FRAME_PX,
  SHELF_ICON_SIZE_PX,
  type ShelfIconId,
  type ShelfIconSize,
} from "@/lib/constants/shelfIcons";
import { cn } from "@/lib/utils/cn";

type DefaultProps = {
  id: ShelfIconId;
  iconKey?: never;
};

type CustomProps = {
  id?: never;
  iconKey?: string | null;
};

type Props = (DefaultProps | CustomProps) & {
  size?: ShelfIconSize;
  className?: string;
  /** When true, exposes the shelf name to assistive tech (default: decorative). */
  labeled?: boolean;
  /** Subtle entrance fade when mounted (respects prefers-reduced-motion). */
  animate?: boolean;
};

export function ShelfIcon({
  id,
  iconKey,
  size = "small",
  className,
  labeled = false,
  animate = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isCustom = id == null;
  const defaultConfig = id ? getShelfIconConfig(id) : null;
  const src = isCustom
    ? error
      ? getCustomShelfIconFallbackSrc()
      : getCustomShelfIconSrc(iconKey)
    : defaultConfig!.src;
  const a11y = isCustom
    ? getCustomShelfA11yLabel(iconKey)
    : defaultConfig!.accessibilityLabel;
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
      aria-label={labeled ? a11y : undefined}
      aria-hidden={!labeled}
    >
      {!loaded && !error ? (
        <span
          className="block animate-pulse bg-transparent opacity-40"
          style={{ width: px, height: px }}
          aria-hidden
        />
      ) : null}
      {error && !isCustom ? (
        <span className="block bg-transparent" style={{ width: px, height: px }} aria-hidden />
      ) : (
        <Image
          src={src}
          alt={labeled ? a11y : ""}
          width={px}
          height={px}
          className={cn(
            "object-contain dark:brightness-110",
            !loaded && "absolute opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (isCustom && src !== getCustomShelfIconFallbackSrc()) {
              setError(true);
              setLoaded(false);
              return;
            }
            setError(true);
          }}
          unoptimized
        />
      )}
    </span>
  );
}
