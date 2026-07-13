"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookCover } from "@/components/books/BookCover";
import { LoadingState } from "@/components/ui/LoadingState";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getBooksInSeries, type SeriesData, type SeriesBook } from "@/lib/services/series";
import { bookDetailsPath } from "@/lib/routes/book";
import { seriesPagePath } from "@/lib/routes/series";
import { authorPagePath } from "@/lib/routes/author";
import { cn } from "@/lib/utils/cn";

function statusPill(book: SeriesBook): { label: string; className: string } {
  switch (book.shelf_status) {
    case "read":
      return {
        label: "Read",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      };
    case "currently_reading":
      return {
        label: "Reading",
        className: "bg-royal-orange/15 text-puce-red",
      };
    case "want_to_read":
      return {
        label: "On your TBR",
        className: "bg-primary/20 text-puce-red",
      };
    default:
      return {
        label: "Not added",
        className: "bg-border/60 text-text-muted",
      };
  }
}

function SeriesRow({ book, index }: { book: SeriesBook; index: number }) {
  const pill = statusPill(book);
  const positionLabel =
    book.series_position != null ? `#${book.series_position}` : `${index + 1}`;

  return (
    <li className="flex items-center gap-4 rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-puce-red"
        aria-hidden
      >
        {positionLabel}
      </div>
      <Link href={bookDetailsPath(book.id)} className="shrink-0">
        <BookCover
          title={book.title}
          author={book.author}
          coverUrl={book.cover_url}
          className="h-20 w-14 rounded-md"
          bookmarked={book.shelf_status !== null}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={bookDetailsPath(book.id)}
          className="line-clamp-2 font-semibold text-text hover:text-primary"
        >
          {book.series_position != null ? (
            <span className="text-text-muted">Book {book.series_position}: </span>
          ) : null}
          {book.title}
        </Link>
        {book.author ? (
          <p className="mt-0.5 line-clamp-1 text-sm text-text-muted">
            <Link href={authorPagePath(book.author)} className="hover:text-primary hover:underline">
              {book.author}
            </Link>
          </p>
        ) : null}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
          pill.className
        )}
      >
        {pill.label}
      </span>
    </li>
  );
}

function SeriesPageContent() {
  const searchParams = useSearchParams();
  const seriesName = searchParams.get("name")?.trim() ?? "";
  const user = useAuthUser();
  const [data, setData] = useState<SeriesData | null | undefined>(undefined);

  useEffect(() => {
    if (!seriesName) {
      setData(null);
      return;
    }
    if (user === undefined) return;

    void getBooksInSeries(seriesName, user?.id)
      .then(setData)
      .catch((error) => {
        console.error("[series] load failed:", error);
        setData(null);
      });
  }, [seriesName, user]);

  if (!seriesName) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No series selected.</p>
        <ButtonLink href="/search" variant="primary">
          Search for books
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || data === undefined) {
    return <LoadingState message="Loading series…" />;
  }

  if (!data || data.books.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-2xl font-bold text-puce-red">{data?.name ?? seriesName}</h1>
        <p className="text-text-muted">
          No books from this series are in the catalog yet. Add more books from this
          series and they&apos;ll be grouped here automatically.
        </p>
        <Link href="/library" className="text-sm font-medium text-primary hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  const { name, books, inLibraryCount, readCount } = data;
  const total = books.length;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-4 text-center">
        <Link href="/library" className="text-sm font-medium text-primary hover:underline">
          ← Back to library
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-3xl font-bold text-puce-red">{name}</h1>
          <CopyLinkButton path={seriesPagePath(name)} label="Copy link" variant="outline" />
        </div>
        <p className="text-text-muted">
          {total} book{total === 1 ? "" : "s"} in reading order
          {user ? ` · ${readCount} read · ${inLibraryCount} in your library` : ""}
        </p>
      </header>

      <ol className="space-y-3">
        {books.map((book, index) => (
          <SeriesRow key={book.id} book={book} index={index} />
        ))}
      </ol>
    </div>
  );
}

export default function SeriesPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading series…" />}>
      <SeriesPageContent />
    </Suspense>
  );
}
