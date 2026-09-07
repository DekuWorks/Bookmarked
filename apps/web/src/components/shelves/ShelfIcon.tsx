"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getCustomShelfIconA11yLabel,
  getCustomShelfIconFallbackSrc,
  getCustomShelfIconSrc,
  getShelfIconConfig,
  resolveCustomShelfIcon,
  SHELF_ICON_FRAME_PX,
  SHELF_ICON_SIZE_PX,
  type ShelfIconId,
  type ShelfIconSize,
} from "@/lib/constants/shelfIcons";
import { cn } from "@/lib/utils/cn";

type DefaultProps = {
  id: ShelfIconId;
  iconKey?: never;
  iconType?: never;
  iconEmoji?: never;
};

type CustomProps = {
  id?: never;
  iconKey?: string | null;
  iconType?: string | null;
  iconEmoji?: string | null;
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
  iconType,
  iconEmoji,
  size = "small",
  className,
  labeled = false,
  animate = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isCustom = id == null;
  const defaultConfig = id ? getShelfIconConfig(id) : null;
  const customSelection = isCustom
    ? resolveCustomShelfIcon({
        icon_key: iconKey,
        icon_type: iconType,
        icon_emoji: iconEmoji,
      })
    : null;
  const isEmoji = customSelection?.type === "emoji";
  const src = isCustom
    ? error
      ? getCustomShelfIconFallbackSrc()
      : getCustomShelfIconSrc(iconKey)
    : defaultConfig!.src;
  const a11y = isCustom
    ? getCustomShelfIconA11yLabel(customSelection)
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
      {isEmoji ? (
        <span
          className="flex items-center justify-center leading-none"
          style={{ width: px, height: px, fontSize: Math.round(px * 0.82) }}
        >
          {customSelection.value}
        </span>
      ) : (
        <>
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
        </>
      )}
    </span>
  );
}
