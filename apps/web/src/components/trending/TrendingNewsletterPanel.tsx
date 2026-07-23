"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { CommunityRatingDisplay } from "@/components/books/CommunityRatingDisplay";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchTrendingSections, type TrendingBook, type TrendingSection } from "@/lib/services/trending";
import { bookDetailsPath } from "@/lib/routes/book";
import { cn } from "@/lib/utils/cn";

function TrendingBookRow({ book }: { book: TrendingBook }) {
  return (
    <li>
      <Link
        href={bookDetailsPath(book.bookId)}
        className="group flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3 transition hover:border-primary/30 hover:bg-background hover:shadow-sm"
      >
        <div className="relative h-[4.5rem] w-[3rem] shrink-0 overflow-hidden rounded-md border border-border bg-white shadow-sm">
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            className="h-full w-full"
            sizes="48px"
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5 text-left">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-text group-hover:text-puce-red">
            {book.title}
          </p>
          {book.author ? (
            <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-text-muted">
              {book.author}
            </p>
          ) : null}
          {book.communityRating ? (
            <CommunityRatingDisplay
              rating={book.communityRating}
              className="mt-2 justify-start gap-1.5"
            />
          ) : null}
          <p className="mt-2 text-xs font-medium text-primary">
            {book.metric} {book.metricLabel}
          </p>
        </div>
      </Link>
    </li>
  );
}

type Props = {
  className?: string;
};

export function TrendingNewsletterPanel({ className }: Props) {
  const [sections, setSections] = useState<TrendingSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchTrendingSections()
      .then(setSections)
      .catch((err) => {
        console.error("[trending] load failed:", err);
        setError("Could not load trending books right now.");
        setSections([]);
      });
  }, []);

  if (sections === null) {
    return <LoadingState message="Loading community picks…" />;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-text-muted">
        {error}
      </p>
    );
  }

  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
        Community trends will appear here as readers shelve and review books.
      </p>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          aria-labelledby={`trending-${section.id}`}
          className={cn(sectionIndex > 0 && "border-t border-border/60 pt-6")}
        >
          <h3
            id={`trending-${section.id}`}
            className="text-sm font-semibold tracking-tight text-puce-red"
          >
            {section.title}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {section.books.map((book) => (
              <TrendingBookRow key={book.bookId} book={book} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
