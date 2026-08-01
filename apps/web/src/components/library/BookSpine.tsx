"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { authorPagePath } from "@/lib/routes/author";

type Props = {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  pageCount?: number | null;
  href?: string;
  className?: string;
  bookmarked?: boolean;
};

const SPINE_COLORS = [
  "bg-puce-red",
  "bg-rust",
  "bg-royal-orange",
  "bg-primary",
  "bg-orange-yellow/80",
];

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function spineWidthClass(pageCount?: number | null): string {
  if (!pageCount || pageCount < 180) return "w-11 sm:w-12";
  if (pageCount < 320) return "w-12 sm:w-14";
  if (pageCount < 480) return "w-14 sm:w-16";
  return "w-16 sm:w-20";
}

export function BookSpine({
  title,
  author,
  coverUrl,
  pageCount,
  href,
  className,
}: Props) {
  const hash = hashTitle(title);
  const spineColor = SPINE_COLORS[hash % SPINE_COLORS.length];
  const widthClass = spineWidthClass(pageCount);

  const content = (
    <div
      className={cn("book-spine-wrapper flex-shrink-0", className)}
      title={author ? `${title} — ${author}` : title}
    >
      <div
        className={cn(
          "book-spine group relative h-56 rounded-t-[3px] transition-transform duration-200 hover:-translate-y-1.5 sm:h-60",
          "book-spine-shadow",
          widthClass
        )}
      >
        <div className="absolute inset-0 overflow-hidden rounded-t-[3px]">
          {coverUrl ? (
            <div className="book-spine-cover absolute inset-0" aria-hidden>
              <img
                src={coverUrl}
                alt=""
                className="book-spine-cover-image"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div className={cn("absolute inset-0", spineColor)} aria-hidden />
          )}

          <div className="book-spine-overlay absolute inset-0" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center px-1 py-3">
            <span className="book-spine-title" aria-label={title}>
              {title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <div className="flex flex-col items-center">
        <Link href={href} className="block flex-shrink-0">
          {content}
        </Link>
        {author ? (
          <Link
            href={authorPagePath(author)}
            className="mt-1 max-w-[4.5rem] truncate text-center text-[10px] text-text-muted hover:text-primary hover:underline"
          >
            {author}
          </Link>
        ) : null}
      </div>
    );
  }

  return content;
}
