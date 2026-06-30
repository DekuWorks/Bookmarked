"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookCard } from "@/components/books/BookCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getBooksByAuthor } from "@/lib/services/authorBooks";
import { authorPagePath } from "@/lib/routes/author";
import { bookDetailsPath } from "@/lib/routes/book";

function AuthorPageContent() {
  const searchParams = useSearchParams();
  const authorName = searchParams.get("name")?.trim() ?? "";
  const user = useAuthUser();
  const [data, setData] = useState<
    Awaited<ReturnType<typeof getBooksByAuthor>> | null | undefined
  >(undefined);

  useEffect(() => {
    if (!authorName) {
      setData(null);
      return;
    }
    if (!user) return;

    void getBooksByAuthor(authorName, user.id).then(setData);
  }, [authorName, user]);

  if (!authorName) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No author selected.</p>
        <ButtonLink href="/search" variant="primary">
          Search for books
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || data === undefined) {
    return <LoadingState message="Loading author…" />;
  }

  if (!user || data === null) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">Sign in to browse books by this author.</p>
        <Link href="/library" className="text-sm font-medium text-primary hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  const { libraryBooks, catalogBooks } = data;
  const totalCount = libraryBooks.length + catalogBooks.length;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="space-y-4 text-center">
        <Link href="/library" className="text-sm font-medium text-primary hover:underline">
          ← Back to library
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-3xl font-bold text-puce-red">{authorName}</h1>
          <CopyLinkButton path={authorPagePath(authorName)} label="Copy link" variant="outline" />
        </div>
        <p className="text-text-muted">
          {totalCount === 0
            ? "No books found for this author yet."
            : `${totalCount} book${totalCount === 1 ? "" : "s"} in your library and catalog`}
        </p>
      </header>

      {libraryBooks.length > 0 ? (
        <section className="space-y-4" aria-labelledby="author-library-heading">
          <h2 id="author-library-heading" className="text-xl font-semibold text-puce-red">
            In your library
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {libraryBooks.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.cover_url}
                href={bookDetailsPath(book.id)}
                shelfStatus={book.shelf_status}
              />
            ))}
          </div>
        </section>
      ) : null}

      {catalogBooks.length > 0 ? (
        <section className="space-y-4" aria-labelledby="author-catalog-heading">
          <h2 id="author-catalog-heading" className="text-xl font-semibold text-puce-red">
            In catalog
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogBooks.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.cover_url}
                href={bookDetailsPath(book.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {totalCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
          <p className="text-sm text-text-muted">
            Try searching Open Library to add books by {authorName}.
          </p>
          <ButtonLink
            href={`/search/?q=${encodeURIComponent(authorName)}`}
            variant="primary"
            className="mt-4"
          >
            Search for {authorName}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

export default function AuthorPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading author…" />}>
      <AuthorPageContent />
    </Suspense>
  );
}
