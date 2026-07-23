"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCoverPalette } from "@/lib/hooks/useCoverPalette";
import { cn } from "@/lib/utils/cn";

type Props = {
  coverUrl?: string | null;
  children: ReactNode;
  className?: string;
};

/**
 * Soft cover-tinted hero wash (Fable-style ambience) without restructuring the page.
 */
export function BookCoverAmbience({ coverUrl, children, className }: Props) {
  const palette = useCoverPalette(coverUrl);

  const style: CSSProperties | undefined = palette
    ? {
        background: `linear-gradient(180deg, ${palette.washTop} 0%, ${palette.washBottom} 72%)`,
      }
    : undefined;

  return (
    <div
      className={cn(
        "relative -mx-4 rounded-b-3xl px-4 pb-8 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
        !palette && "feed-header-gradient",
        className
      )}
      style={style}
    >
      {palette ? (
        <div
          className="pointer-events-none absolute inset-x-8 top-6 h-32 rounded-full blur-3xl"
          style={{ backgroundColor: palette.accent, opacity: 0.22 }}
          aria-hidden
        />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}
