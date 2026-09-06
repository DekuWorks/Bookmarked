"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { FeedCard } from "@/components/social/FeedCard";
import { ReaderSearchCard } from "@/components/social/ReaderSearchCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { bookDetailsPath } from "@/lib/routes/book";
import type { FeedSearchResults } from "@/lib/services/feedSearch";

type Props = {
  query: string;
  results: FeedSearchResults | null;
  loading: boolean;
  error: string | null;
};

export function FeedSearchResults({ query, results, loading, error }: Props) {
  if (loading) {
    return <LoadingState message="Searching…" />;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!results) return null;

  const total =
    results.readers.length + results.books.length + results.posts.length + (results.moods?.length ?? 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
        <p className="font-medium text-puce-red">No results for &ldquo;{query}&rdquo;</p>
        <p className="mt-2 text-sm text-text-muted">
          Try a reader username, book title, author, or a mood like #Cozy.
        </p>
        <div className="mt-4">
          <ButtonLink href={`/search?q=${encodeURIComponent(query)}`} variant="outline" size="sm">
            Search books
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {results.readers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Readers
          </h2>
          <ul className="space-y-3">
            {results.readers.map((reader) => (
              <li key={reader.id}>
                <ReaderSearchCard reader={reader} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.books.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Books
            </h2>
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Search books
            </Link>
          </div>
          <ul className="space-y-2">
            {results.books.map((book) => (
              <li key={book.id}>
                <Link
                  href={bookDetailsPath(book.id)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
                >
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md">
                    <BookCover
                      title={book.title}
                      author={book.author}
                      coverUrl={book.cover_url}
                      className="h-full w-full"
                      bookmarked={Boolean(book.onShelf)}
                      bookmarkBadgeSize="small"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold text-text">{book.title}</p>
                    {book.author ? (
                      <p className="mt-0.5 line-clamp-1 text-sm text-text-muted">
                        {book.author}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(results.moods?.length ?? 0) > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Mood / vibe
          </h2>
          <ul className="space-y-2">
            {(results.moods ?? []).map((hit) => (
              <li key={hit.id}>
                <Link
                  href={bookDetailsPath(hit.bookId)}
                  className="block rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <p className="font-semibold text-text">{hit.bookTitle}</p>
                  {hit.author ? <p className="text-sm text-text-muted">{hit.author}</p> : null}
                  <p className="mt-1 text-xs text-text-muted">{hit.feelings.join(" · ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.posts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Posts
          </h2>
          <ul className="space-y-4">
            {results.posts.map((item) => (
              <li key={item.id}>
                <FeedCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
