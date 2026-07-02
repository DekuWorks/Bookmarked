"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBookDetails } from "@/lib/services/bookDetails";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useUserBooksRealtime } from "@/lib/hooks/useUserBooksRealtime";
import { BookCover } from "@/components/books/BookCover";
import { BookShelfActions } from "@/components/books/BookShelfActions";
import { ReadingProgressPanel } from "@/components/books/ReadingProgressPanel";
import { ReadingJournalSection } from "@/components/books/ReadingJournalSection";
import { ReadingDatesEditor } from "@/components/books/ReadingDatesEditor";
import { BookReviewSection } from "@/components/books/BookReviewSection";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { refreshBookFromOpenLibrary } from "@/lib/services/bookMetadata";
import type { BookDetailsData } from "@/lib/services/bookDetails";
import type { ShelfStatus } from "@/types";

function BookDetailsContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id")?.trim() ?? "";
  const focusSection = searchParams.get("section");
  const focusReviews = searchParams.get("section") === "reviews";
  const user = useAuthUser();
  const [data, setData] = useState<BookDetailsData | null | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const loadBookDetails = useCallback(() => {
    if (!user || !bookId) return;
    void getBookDetails(bookId, user.id)
      .then(setData)
      .catch((error) => {
        console.error("[book-details] load failed:", error);
        setData(null);
      });
  }, [user, bookId]);

  useEffect(() => {
    if (!user || !bookId) {
      if (user !== undefined) setData(null);
      return;
    }
    loadBookDetails();
  }, [user, bookId, loadBookDetails]);

  useUserBooksRealtime(user?.id, loadBookDetails);

  useEffect(() => {
    if (focusSection !== "reviews" || !data) return;
    const el = document.getElementById("book-reviews");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusSection, data]);

  useEffect(() => {
    if (!focusReviews || !data) return;
    document.getElementById("book-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusReviews, data]);

  if (!bookId) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No book selected.</p>
        <ButtonLink href="/search" variant="primary">
          Search for books
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || data === undefined) {
    return <LoadingState message="Loading book…" />;
  }

  if (!user || !data) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">Book not found or you need to sign in.</p>
        <Link href="/library" className="text-sm font-medium text-primary hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  const { book, userBook, reviews, ownReview, readingSessions } = data;
  const currentShelf = (userBook?.shelf_status as ShelfStatus | undefined) ?? null;
  const canRefreshFromOpenLibrary =
    book.external_source === "open_library" && Boolean(book.external_id);

  const handleRefreshMetadata = async () => {
    setRefreshError(null);
    setRefreshing(true);
    const result = await refreshBookFromOpenLibrary(book.id);
    setRefreshing(false);

    if (result.error) {
      setRefreshError(result.error);
      return;
    }

    loadBookDetails();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-10 overflow-x-hidden text-center">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/library" className="text-sm font-medium text-primary hover:underline">
          ← Back to library
        </Link>
        <CopyLinkButton path={bookDetailsPath(book.id)} label="Copy link" variant="outline" />
      </div>

      <BookCover
        title={book.title}
        author={book.author}
        coverUrl={book.cover_url}
        className="mx-auto max-w-[220px] shadow-sm"
        priority
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-2xl font-bold text-puce-red sm:text-3xl">{book.title}</h1>
          {currentShelf ? <ShelfBadge status={currentShelf} /> : null}
        </div>
        {book.author ? (
          <p className="mt-2 text-lg text-text-muted">
            <Link
              href={authorPagePath(book.author)}
              className="hover:text-primary hover:underline"
            >
              {book.author}
            </Link>
          </p>
        ) : null}

        {canRefreshFromOpenLibrary ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={refreshing}
              onClick={() => void handleRefreshMetadata()}
            >
              Refresh metadata
            </Button>
            {refreshError ? (
              <p className="text-sm text-royal-orange">{refreshError}</p>
            ) : null}
          </div>
        ) : null}

        <dl className="mx-auto mt-6 grid max-w-md gap-3 text-sm sm:grid-cols-2">
            {book.published_date ? (
              <div>
                <dt className="font-medium text-text-muted">Published</dt>
                <dd className="text-text">{book.published_date}</dd>
              </div>
            ) : null}
            {book.page_count ? (
              <div>
                <dt className="font-medium text-text-muted">Pages</dt>
                <dd className="text-text">{book.page_count}</dd>
              </div>
            ) : null}
            {book.isbn ? (
              <div>
                <dt className="font-medium text-text-muted">ISBN</dt>
                <dd className="break-all text-text">{book.isbn}</dd>
              </div>
            ) : null}
            {book.publisher ? (
              <div>
                <dt className="font-medium text-text-muted">Publisher</dt>
                <dd className="text-text">{book.publisher}</dd>
              </div>
            ) : null}
          </dl>

          {book.subjects && book.subjects.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {book.subjects.slice(0, 8).map((subject) => (
                <span
                  key={subject}
                  className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-puce-red"
                >
                  {subject}
                </span>
              ))}
            </div>
          ) : null}

          <section className="mt-8" aria-labelledby="book-description-heading">
            <h2 id="book-description-heading" className="text-lg font-semibold text-puce-red">
              About this book
            </h2>
            {book.description ? (
              <p className="mx-auto mt-3 max-w-prose text-pretty leading-relaxed text-text">
                {book.description}
              </p>
            ) : (
              <p className="mt-3 text-text-muted">
                No description available yet. Metadata is filled in from Open Library when
                possible.
              </p>
            )}
          </section>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 text-left lg:grid-cols-2">
        <BookShelfActions
          bookId={book.id}
          bookTitle={book.title}
          currentShelf={currentShelf}
          isFavorite={Boolean(userBook?.is_favorite)}
        />
        <ReadingProgressPanel
          bookId={book.id}
          onShelf={Boolean(userBook)}
          currentPage={Number(userBook?.progress_pages) || 0}
          totalPages={book.page_count ?? 0}
          progressPercent={Number(userBook?.progress_percent) || 0}
          startedAt={userBook?.started_at}
          finishedAt={userBook?.finished_at}
          onProgressChange={loadBookDetails}
        />
      </div>

      {userBook ? (
        <div className="mx-auto grid max-w-4xl gap-6 text-left lg:grid-cols-2">
          <ReadingDatesEditor
            bookId={book.id}
            onShelf={Boolean(userBook)}
            startedAt={userBook.started_at}
            finishedAt={userBook.finished_at}
            onDatesChange={loadBookDetails}
          />
          <ReadingJournalSection sessions={readingSessions} />
        </div>
      ) : null}

      <div id="book-reviews">
        <BookReviewSection
          bookId={book.id}
          ownReview={ownReview}
          reviews={reviews}
          onReviewsChange={loadBookDetails}
        />
      </div>
    </div>
  );
}

export default function BookDetailsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading book…" />}>
      <BookDetailsContent />
    </Suspense>
  );
}
