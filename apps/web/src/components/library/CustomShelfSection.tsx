import Link from "next/link";
import { BookSpine } from "@/components/library/BookSpine";
import { EmptyShelfMessage } from "@/components/library/EmptyShelfMessage";
import { customShelfPath } from "@/lib/routes/customShelf";
import { bookDetailsPath } from "@/lib/routes/book";
import type { CustomShelfGroup } from "@/lib/services/customShelves";

type Props = {
  shelf: CustomShelfGroup;
  showHeaderLink?: boolean;
};

export function CustomShelfSection({ shelf, showHeaderLink = true }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col items-center justify-center gap-2 border-b border-border px-4 py-3 text-center sm:flex-row sm:justify-between">
        <div>
          <h2 className="flex flex-wrap items-center justify-center gap-2 text-lg font-semibold text-puce-red sm:justify-start">
            <span aria-hidden>📚</span>
            {shelf.name}
            <span className="text-sm font-normal text-text-muted">({shelf.items.length})</span>
          </h2>
          {shelf.genre ? (
            <p className="mt-0.5 text-xs text-text-muted">Genre: {shelf.genre}</p>
          ) : null}
        </div>
        {showHeaderLink ? (
          <Link
            href={customShelfPath(shelf.slug)}
            className="text-sm font-medium text-primary hover:underline"
          >
            View shelf
          </Link>
        ) : null}
      </div>

      <div className="bookshelf-back px-4 pb-0 pt-5">
        {shelf.items.length === 0 ? (
          <EmptyShelfMessage className="pb-6" />
        ) : (
          <div className="bookshelf-row scrollbar-thin">
            {shelf.items.map((item) => {
              const book = item.books;
              return (
                <BookSpine
                  key={item.id}
                  title={book?.title ?? "Untitled"}
                  author={book?.author}
                  coverUrl={book?.cover_url}
                  pageCount={book?.page_count}
                  href={book?.id ? bookDetailsPath(book.id) : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="bookshelf-board h-5 rounded-b-xl" aria-hidden />
    </section>
  );
}
