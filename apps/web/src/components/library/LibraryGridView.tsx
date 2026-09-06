import { BookCard } from "@/components/books/BookCard";
import { EmptyShelfMessage } from "@/components/library/EmptyShelfMessage";
import { ShelfTitleRow } from "@/components/shelves/ShelfTitleRow";
import { bookDetailsPath } from "@/lib/routes/book";
import type { ShelfGroup } from "@/lib/services/library";
import { resolveTrackingFormat } from "@bookmarked/utils/listeningTime";

type Props = {
  shelves: ShelfGroup[];
};

export function LibraryGridView({ shelves }: Props) {
  return (
    <div className="space-y-10">
      {shelves.map((shelf) => (
        <section key={shelf.status}>
          <h2 className="mb-4">
            <ShelfTitleRow id={shelf.status} title={shelf.title} />
          </h2>
          {shelf.items.length === 0 ? (
            <EmptyShelfMessage />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shelf.items.map((ub) => {
                const book = ub.books;
                return (
                  <BookCard
                    key={ub.id}
                    title={book?.title ?? "Untitled"}
                    author={book?.author}
                    coverUrl={book?.cover_url}
                    shelfStatus={shelf.status}
                    progressPercent={Number(ub.progress_percent) || 0}
                    format={resolveTrackingFormat({
                      userFormat: ub.tracking_format,
                      catalogFormat: book?.format,
                    })}
                    href={book?.id ? bookDetailsPath(book.id) : undefined}
                  />
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
