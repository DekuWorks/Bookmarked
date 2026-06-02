import Link from "next/link";
import { BookSpine } from "@/components/library/BookSpine";
import type { LibraryBookRow } from "@/lib/services/library";
import type { ShelfStatus } from "@/types";

type Props = {
  title: string;
  emoji: string;
  status: ShelfStatus;
  slug: string;
  items: LibraryBookRow[];
  showHeaderLink?: boolean;
};

export function BookshelfSection({
  title,
  emoji,
  status,
  slug,
  items,
  showHeaderLink = true,
}: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-puce-red">
          <span aria-hidden>{emoji}</span>
          {title}
          <span className="text-sm font-normal text-text-muted">({items.length})</span>
        </h2>
        {showHeaderLink ? (
          <Link
            href={`/library/${slug}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View shelf
          </Link>
        ) : null}
      </div>

      <div className="bookshelf-back px-4 pb-0 pt-6">
        {items.length === 0 ? (
          <p className="pb-6 text-sm text-text-muted">No books on this shelf yet.</p>
        ) : (
          <div className="flex items-end gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {items.map((ub) => {
              const book = ub.books;
              return (
                <BookSpine
                  key={ub.id}
                  title={book?.title ?? "Untitled"}
                  author={book?.author}
                  coverUrl={book?.cover_url}
                  href={book?.id ? `/books/${book.id}` : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="bookshelf-board h-4 rounded-b-xl" aria-hidden />
    </section>
  );
}
