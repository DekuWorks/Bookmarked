"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { CommunityRatingDisplay } from "@/components/books/CommunityRatingDisplay";
import {
  fetchTrendingSections,
  type TrendingBook,
  type TrendingSection,
} from "@/lib/services/trending";
import { bookDetailsPath } from "@/lib/routes/book";
import type { FeedDiscoverySectionId } from "@bookmarked/utils/feedDiscovery";
import { cn } from "@/lib/utils/cn";

const SECTION_TITLES: Record<FeedDiscoverySectionId, string> = {
  trending: "Trending Books",
  shelved: "Most Shelved",
  reviewed: "Most Reviewed",
};

type Props = {
  sectionId: FeedDiscoverySectionId;
  className?: string;
};

function DiscoveryBook({ book }: { book: TrendingBook }) {
  return (
    <li className="w-[7.5rem] shrink-0">
      <Link
        href={bookDetailsPath(book.bookId)}
        className="group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
      >
        <div className="relative h-40 w-[7.5rem] overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            className="h-full w-full"
            sizes="120px"
          />
        </div>
        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-snug text-text group-hover:text-puce-red">
          {book.title}
        </p>
        {book.communityRating ? (
          <CommunityRatingDisplay
            rating={book.communityRating}
            className="mt-1 justify-start gap-1"
          />
        ) : null}
        <p className="mt-1 text-[11px] font-medium text-primary">
          {book.metric} {book.metricLabel}
        </p>
      </Link>
    </li>
  );
}

export function FeedDiscoveryCard({ sectionId, className }: Props) {
  const [section, setSection] = useState<TrendingSection | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchTrendingSections()
      .then((sections) => {
        if (cancelled) return;
        const match =
          sections.find((row) => row.id === sectionId) ??
          sections.find((row) =>
            row.title.toLowerCase().includes(SECTION_TITLES[sectionId].toLowerCase().split(" ")[0]!)
          ) ??
          null;
        setSection(match);
      })
      .catch(() => {
        if (!cancelled) setSection(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  if (section === undefined) {
    return (
      <article className={cn("surface-card p-5 text-left", className)} aria-busy="true">
        <p className="text-sm text-text-muted">Loading discovery…</p>
      </article>
    );
  }

  if (!section || section.books.length === 0) return null;

  return (
    <article className={cn("surface-card p-5 text-left", className)}>
      <h2 className="text-base font-semibold text-puce-red">
        {SECTION_TITLES[sectionId] ?? section.title}
      </h2>
      <p className="mt-1 text-sm text-text-muted">Scroll to explore what readers are loving.</p>
      <ul className="bookshelf-row mt-4 gap-3 pb-1">
        {section.books.map((book) => (
          <DiscoveryBook key={book.bookId} book={book} />
        ))}
      </ul>
    </article>
  );
}
