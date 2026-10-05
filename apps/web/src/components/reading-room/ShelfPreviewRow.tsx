import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { bookDetailsPath } from "@/lib/routes/book";
import type { LibraryBookRow } from "@/lib/services/library";
import { bookCountLabel } from "@bookmarked/utils/overviewShelfPreview";

type Props = {
  title: string;
  count: number;
  items: LibraryBookRow[];
};

export function ShelfPreviewRow({ title, count, items }: Props) {
  return (
    <div className="flex items-end gap-3 md:gap-5">
      <div className="w-24 shrink-0 pb-3 md:w-28">
        <p className="font-semibold text-puce-red">{title}</p>
        <p className="text-sm text-text-muted">{bookCountLabel(count)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="bookshelf-back flex min-h-16 items-end gap-2 overflow-x-auto px-2 pt-2">
          {items.map((item) => {
            const book = item.books;
            const bookTitle = book?.title ?? "Untitled";
            if (!book?.id) return null;
            return (
              <Link
                key={item.id}
                href={bookDetailsPath(book.id, { origin: "reading_room_overview" })}
                className="relative w-11 shrink-0 self-end overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange md:w-14"
              >
                <BookCover
                  title={bookTitle}
                  author={book.author}
                  coverUrl={book.cover_url}
                  alt={`${bookTitle} cover`}
                  objectFit="contain"
                  sizes="56px"
                />
              </Link>
            );
          })}
          {count === 0 ? (
            <p className="pb-2 text-sm text-text-muted">No books on this shelf yet.</p>
          ) : null}
        </div>
        <div className="bookshelf-board h-3 rounded-b-sm" aria-hidden />
      </div>
    </div>
  );
}
