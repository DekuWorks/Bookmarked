"use client";

import { useState } from "react";
import Image from "next/image";
import { SavedBookBadge } from "@/components/books/SavedBookBadge";
import { cn } from "@/lib/utils/cn";

import type { SavedBookBadgeSize } from "@/lib/constants/brandAssets";

type Props = {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  className?: string;
  sizes?: string;
  /** `contain` shows complete artwork; default `cover` fills the 2:3 frame. */
  objectFit?: "cover" | "contain";
  priority?: boolean;
  /** When true, shows the brand logo shelf badge on the cover. */
  isSaved?: boolean;
  /** @deprecated Prefer `isSaved`. */
  bookmarked?: boolean;
  onToggleSave?: () => void;
  bookmarkBadgeSize?: SavedBookBadgeSize;
};

function CoverPlaceholder({
  title,
  author,
}: {
  title: string;
  author?: string | null;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-between bg-gradient-to-br from-primary/30 via-puce-red/10 to-royal-orange/25 p-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-orange">
        Bookmarked
      </p>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-3">
        <span className="text-3xl opacity-80" aria-hidden>
          📖
        </span>
        <p className="line-clamp-4 text-sm font-semibold leading-snug text-puce-red">
          {title}
        </p>
        {author ? (
          <p className="line-clamp-2 text-xs text-text-muted">{author}</p>
        ) : null}
      </div>
    </div>
  );
}

export function BookCover({
  title,
  author,
  coverUrl,
  className,
  sizes = "(max-width: 768px) 50vw, 220px",
  objectFit = "cover",
  priority,
  isSaved,
  bookmarked = false,
  onToggleSave,
  bookmarkBadgeSize = "medium",
}: Props) {
  const [imageError, setImageError] = useState(false);
  const showImage = coverUrl && !imageError;
  const saved = isSaved ?? bookmarked;

  return (
    <div className={cn("relative aspect-[2/3] w-full overflow-visible", className)}>
      {/* Square top when saved so the ribbon sits flush on a straight edge. */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden border border-border bg-background",
          saved ? "rounded-none" : "rounded-xl"
        )}
      >
        {showImage ? (
          <Image
            src={coverUrl}
            alt={`Cover of ${title}`}
            fill
            className={objectFit === "contain" ? "object-contain" : "object-cover"}
            sizes={sizes}
            unoptimized
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onError={() => setImageError(true)}
          />
        ) : (
          <CoverPlaceholder title={title} author={author} />
        )}
      </div>
      <SavedBookBadge
        isSaved={saved}
        onToggle={onToggleSave}
        size={bookmarkBadgeSize}
      />
    </div>
  );
}
