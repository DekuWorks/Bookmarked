import Link from "next/link";
import { BookshelfView } from "@/components/library/BookshelfView";
import { BookCard } from "@/components/books/BookCard";
import { LibraryAnalyticsPanel } from "@/components/library/LibraryAnalytics";
import type { LibraryAnalytics, LibraryBookRow, ShelfGroup } from "@/lib/services/library";

type Props = {
  displayName: string | null;
  username: string | null;
  shelves: ShelfGroup[];
  analytics: LibraryAnalytics;
  allBooks: LibraryBookRow[];
};

export function ReadingRoom({
  displayName,
  username,
  shelves,
  analytics,
  allBooks,
}: Props) {
  const favorites = allBooks.filter((b) => b.is_favorite);
  const currentlyReading = allBooks.filter((b) => b.shelf_status === "currently_reading");
  const recentlyFinished = allBooks
    .filter((b) => b.shelf_status === "read")
    .sort((a, b) => {
      const aDate = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const bDate = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 6);

  return (
    <div className="reading-room-wall -mx-4 space-y-8 rounded-2xl px-4 py-8 md:-mx-8 md:px-8">
      <header className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-royal-orange">
          My Reading Room
        </p>
        <h2 className="mt-2 text-3xl font-bold text-puce-red">
          {displayName ? `${displayName}'s Library` : "Your Library"}
        </h2>
        {username ? <p className="mt-1 text-text-muted">@{username}</p> : null}
        <p className="mx-auto mt-3 max-w-lg text-sm text-text-muted">
          Your digital home library — search, collect, organize, and visualize your reading life.
        </p>
      </header>

      <LibraryAnalyticsPanel analytics={analytics} compact />

      {currentlyReading.length > 0 ? (
        <section>
          <h3 className="mb-4 text-lg font-semibold text-puce-red">Currently reading</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentlyReading.map((ub) => {
              const book = ub.books;
              return (
                <BookCard
                  key={ub.id}
                  title={book?.title ?? "Untitled"}
                  author={book?.author}
                  coverUrl={book?.cover_url}
                  shelfStatus="currently_reading"
                  progressPercent={Number(ub.progress_percent) || 0}
                  href={book?.id ? `/books/${book.id}` : undefined}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {favorites.length > 0 ? (
        <section>
          <h3 className="mb-4 text-lg font-semibold text-puce-red">Favorite books</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((ub) => {
              const book = ub.books;
              return (
                <BookCard
                  key={ub.id}
                  title={book?.title ?? "Untitled"}
                  author={book?.author}
                  coverUrl={book?.cover_url}
                  shelfStatus={ub.shelf_status}
                  href={book?.id ? `/books/${book.id}` : undefined}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <BookshelfView shelves={shelves} />

      {recentlyFinished.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-puce-red">Recently finished</h3>
            <Link href="/library/read" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyFinished.map((ub) => {
              const book = ub.books;
              return (
                <BookCard
                  key={ub.id}
                  title={book?.title ?? "Untitled"}
                  author={book?.author}
                  coverUrl={book?.cover_url}
                  shelfStatus="read"
                  href={book?.id ? `/books/${book.id}` : undefined}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
