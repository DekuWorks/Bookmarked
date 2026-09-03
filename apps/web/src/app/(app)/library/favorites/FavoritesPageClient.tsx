"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookCard } from "@/components/books/BookCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { layout } from "@/lib/constants/layout";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { bookDetailsPath } from "@/lib/routes/book";
import { getUserLibraryBooks, type LibraryBookRow } from "@/lib/services/library";
import { FAVORITES_LISTING } from "@bookmarked/utils/overviewCopy";
import { originBackLink } from "@bookmarked/utils/navigationOrigin";

export default function FavoritesPageClient() {
  const user = useAuthUser();
  const searchParams = useSearchParams();
  const back = originBackLink(searchParams.get("origin"), "web", {
    href: "/library/",
    label: "← Back to Library",
  });
  const [books, setBooks] = useState<LibraryBookRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      setBooks([]);
      return;
    }

    setLoadError(null);
    void getUserLibraryBooks(user.id)
      .then((rows) => setBooks(rows.filter((book) => book.is_favorite)))
      .catch((error: unknown) => {
        console.error("[favorites] failed to load:", error);
        setLoadError("Could not load favorites. Please refresh and try again.");
      });
  }, [user]);

  const favorites = useMemo(() => books ?? [], [books]);

  if (user === undefined || (user && books === null && !loadError)) {
    return <LoadingState message="Loading favorites…" />;
  }

  if (loadError) {
    return (
      <div className="text-center">
        <p className="text-rust">{loadError}</p>
        <Link href={back.href} className="mt-4 inline-block text-sm text-primary hover:underline">
          {back.label}
        </Link>
      </div>
    );
  }

  return (
    <div className={layout.pageStackWide}>
      <header className="flex flex-col items-center gap-3 text-center">
        <Link href={back.href} className="text-sm font-medium text-primary hover:underline">
          {back.label}
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight text-puce-red sm:text-4xl">
          {FAVORITES_LISTING.title}
        </h1>
        <p className="mx-auto max-w-xl text-pretty text-text-muted">{FAVORITES_LISTING.description}</p>
        <p className="text-sm font-medium text-text">
          {favorites.length} {favorites.length === 1 ? "book" : "books"}
        </p>
      </header>

      {favorites.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-text-muted">
          {FAVORITES_LISTING.empty}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favorites.map((ub) => {
            const book = ub.books;
            return (
              <BookCard
                key={ub.id}
                title={book?.title ?? "Untitled"}
                author={book?.author}
                coverUrl={book?.cover_url}
                shelfStatus={ub.shelf_status}
                progressPercent={Number(ub.progress_percent) || 0}
                format={book?.format}
                href={book?.id ? bookDetailsPath(book.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
