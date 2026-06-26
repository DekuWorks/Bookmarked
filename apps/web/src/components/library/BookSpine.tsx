"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  href?: string;
  className?: string;
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

export function BookSpine({ title, author, coverUrl, href, className }: Props) {
  const hash = hashTitle(title);
  const spineColor = SPINE_COLORS[hash % SPINE_COLORS.length];
  const lean = -4 + (hash % 9);

  const content = (
    <div
      className={cn("book-spine-wrapper flex-shrink-0", className)}
      style={{
        transform: `rotate(${lean}deg)`,
        transformOrigin: "bottom center",
      }}
      title={author ? `${title} — ${author}` : title}
    >
      <div
        className={cn(
          "book-spine group relative flex h-44 w-11 flex-col overflow-hidden rounded-t-sm transition-transform duration-200 hover:-translate-y-1",
          "book-spine-shadow"
        )}
      >
        {coverUrl ? (
          <>
            <Image
              src={coverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
              unoptimized
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/15" />
          </>
        ) : (
          <div className={cn("h-full w-full", spineColor)} />
        )}

        <div className="absolute inset-0 flex items-center justify-center px-0.5">
          <span className="book-spine-title" aria-label={title}>
            {title}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-black/15" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-0.5 bg-white/25" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block flex-shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
