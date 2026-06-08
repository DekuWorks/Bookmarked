"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  coverUrl?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

function CoverPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary/15 to-background p-4 text-center">
      <span className="text-3xl text-primary/60" aria-hidden>
        📖
      </span>
      <p className="line-clamp-3 text-xs font-medium text-text-muted">{title}</p>
    </div>
  );
}

export function BookCover({
  title,
  coverUrl,
  className,
  sizes = "(max-width: 768px) 50vw, 220px",
  priority,
}: Props) {
  const [imageError, setImageError] = useState(false);
  const showImage = coverUrl && !imageError;

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-border bg-background",
        className
      )}
    >
      {showImage ? (
        <Image
          src={coverUrl}
          alt={`Cover of ${title}`}
          fill
          className="object-cover"
          sizes={sizes}
          unoptimized
          priority={priority}
          onError={() => setImageError(true)}
        />
      ) : (
        <CoverPlaceholder title={title} />
      )}
    </div>
  );
}
