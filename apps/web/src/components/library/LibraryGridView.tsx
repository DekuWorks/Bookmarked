import { BookCard } from "@/components/books/BookCard";
import type { ShelfGroup } from "@/lib/services/library";

type Props = {
  shelves: ShelfGroup[];
};

export function LibraryGridView({ shelves }: Props) {
  return (
    <div className="space-y-10">
      {shelves.map((shelf) => (
        <section key={shelf.status}>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-puce-red">
            <span aria-hidden>{shelf.emoji}</span>
            {shelf.title}
          </h2>
          {shelf.items.length === 0 ? (
            <p className="text-sm text-text-muted">No books on this shelf yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    href={book?.id ? `/books/${book.id}` : undefined}
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
