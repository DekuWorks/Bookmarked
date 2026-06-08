import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBookDetails } from "@/lib/services/bookDetails";
import { BookCover } from "@/components/books/BookCover";
import { BookShelfActions } from "@/components/books/BookShelfActions";
import { ReadingProgressPanel } from "@/components/books/ReadingProgressPanel";
import { BookReviewSection } from "@/components/books/BookReviewSection";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import type { ShelfStatus } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Book" };
}

export default async function BookDetailsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const data = await getBookDetails(id, user.id);
  if (!data) notFound();

  const { book, userBook, reviews, ownReview } = data;
  const currentShelf = (userBook?.shelf_status as ShelfStatus | undefined) ?? null;

  return (
    <div className="space-y-10 overflow-x-hidden">
      <Link href="/library" className="text-sm font-medium text-primary hover:underline">
        ← Back to library
      </Link>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <BookCover
          title={book.title}
          coverUrl={book.cover_url}
          className="mx-auto max-w-[220px] shadow-sm"
          priority
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-puce-red sm:text-3xl">{book.title}</h1>
            {currentShelf ? <ShelfBadge status={currentShelf} /> : null}
          </div>
          {book.author ? (
            <p className="mt-2 text-lg text-text-muted">{book.author}</p>
          ) : null}

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {book.publisher ? (
              <div>
                <dt className="font-medium text-text-muted">Publisher</dt>
                <dd className="text-text">{book.publisher}</dd>
              </div>
            ) : null}
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
            {book.external_source ? (
              <div>
                <dt className="font-medium text-text-muted">Source</dt>
                <dd className="capitalize text-text">
                  {book.external_source.replace(/_/g, " ")}
                  {book.external_id ? (
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {book.external_id}
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>

          {book.subjects && book.subjects.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
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

          {book.description ? (
            <p className="mt-6 leading-relaxed text-text">{book.description}</p>
          ) : (
            <p className="mt-6 text-text-muted">No description available.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
        />
      </div>

      <BookReviewSection bookId={book.id} ownReview={ownReview} reviews={reviews} />
    </div>
  );
}
