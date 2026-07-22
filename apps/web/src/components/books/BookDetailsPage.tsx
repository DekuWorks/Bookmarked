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
import { ReadingNotesSection } from "@/components/books/ReadingNotesSection";
import { ReadingDatesEditor } from "@/components/books/ReadingDatesEditor";
import { BookReviewSection } from "@/components/books/BookReviewSection";
import { BookTrendBadge } from "@/components/books/BookTrendBadge";
import { CommunityRatingDisplay } from "@/components/books/CommunityRatingDisplay";
import { AddAnotherReadButton } from "@/components/books/AddAnotherReadButton";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { seriesPagePath } from "@/lib/routes/series";
import { refreshBookFromCatalog } from "@/lib/services/bookMetadata";
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
    document.getElementById("book-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusSection, data]);

  useEffect(() => {
    if (!focusReviews || !data) return;
    document.getElementById("book-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusReviews, data]);

  useEffect(() => {
    if (focusSection !== "journal" || !data) return;
    document.getElementById("reading-journal")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusSection, data]);

  useEffect(() => {
    if (focusSection !== "notes" || !data) return;
    document.getElementById("reading-notes")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusSection, data]);

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

  const {
    book,
    userBook,
    reviews,
    ownReviews,
    communityRating,
    badges,
    readingSessions,
  } = data;
  const currentShelf = (userBook?.shelf_status as ShelfStatus | undefined) ?? null;
  const readCount = Number(userBook?.read_count) || 1;
  const hasReviewForCurrentRead = ownReviews.some((r) => r.read_number === readCount);
  const canRefreshFromCatalog = Boolean(book.external_id || book.isbn);

  const handleRefreshMetadata = async () => {
    setRefreshError(null);
    setRefreshing(true);
    const result = await refreshBookFromCatalog(book.id);
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
        bookmarked={Boolean(userBook)}
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-2xl font-bold text-puce-red sm:text-3xl">{book.title}</h1>
          {currentShelf ? <ShelfBadge status={currentShelf} /> : null}
        </div>
        {badges.length > 0 ? (
          <div className="mt-3 flex justify-center">
            <BookTrendBadge badges={badges} size="md" />
          </div>
        ) : null}
        {communityRating ? (
          <div className="mt-3">
            <CommunityRatingDisplay rating={communityRating} />
          </div>
        ) : null}
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

        {book.series_name ? (
          <p className="mt-2">
            <Link
              href={seriesPagePath(book.series_name)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-puce-red hover:bg-primary/25"
            >
              {book.series_position != null
                ? `Part of ${book.series_name} #${book.series_position}`
                : `Part of ${book.series_name}`}
            </Link>
          </p>
        ) : null}

        {canRefreshFromCatalog ? (
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

        {userBook?.completion_tags?.length ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {userBook.completion_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-royal-orange/15 px-3 py-1 text-xs font-medium text-puce-red"
              >
                {tag}
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
              No description available yet. Metadata is filled in from ISBNdb when
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
          bookTitle={book.title}
          onShelf={Boolean(userBook)}
          currentPage={Number(userBook?.progress_pages) || 0}
          totalPages={book.page_count ?? 0}
          progressPercent={Number(userBook?.progress_percent) || 0}
          startedAt={userBook?.started_at}
          finishedAt={userBook?.finished_at}
          hasReviewForCurrentRead={hasReviewForCurrentRead}
          onProgressChange={loadBookDetails}
          onReviewNow={() => {
            document.getElementById("book-reviews")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        />
      </div>

      {userBook ? (
        <div className="mx-auto max-w-4xl space-y-6 text-left">
          <ReadingDatesEditor
            bookId={book.id}
            onShelf={Boolean(userBook)}
            startedAt={userBook.started_at}
            finishedAt={userBook.finished_at}
            onDatesChange={loadBookDetails}
          />
          <ReadingJournalSection sessions={readingSessions} />
          <ReadingNotesSection userBookId={userBook.id} />
        </div>
      ) : null}

      <div id="book-reviews">
        {userBook?.shelf_status === "read" ? (
          <div className="mb-6 flex justify-center">
            <AddAnotherReadButton bookId={book.id} onStarted={loadBookDetails} />
          </div>
        ) : null}
        <BookReviewSection
          bookId={book.id}
          readNumber={readCount}
          ownReviews={ownReviews}
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
