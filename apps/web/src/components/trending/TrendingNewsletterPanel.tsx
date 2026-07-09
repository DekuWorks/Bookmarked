"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchTrendingSections, type TrendingSection } from "@/lib/services/trending";
import { bookDetailsPath } from "@/lib/routes/book";

export function TrendingNewsletterPanel() {
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
      <p className="rounded-xl border border-dashed border-border bg-background px-6 py-8 text-center text-sm text-text-muted">
        Community trends will appear here as readers shelve and review books.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`trending-${section.id}`}>
          <h2 id={`trending-${section.id}`} className="text-lg font-semibold text-puce-red">
            {section.title}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.books.map((book) => (
              <li key={book.bookId}>
                <Link
                  href={bookDetailsPath(book.bookId)}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-3 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    className="w-16 shrink-0"
                    sizes="64px"
                  />
                  <div className="min-w-0 text-left">
                    <p className="line-clamp-2 font-semibold text-text">{book.title}</p>
                    {book.author ? (
                      <p className="line-clamp-1 text-xs text-text-muted">{book.author}</p>
                    ) : null}
                    <p className="mt-1 text-xs font-medium text-primary">
                      {book.metric} {book.metricLabel}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
