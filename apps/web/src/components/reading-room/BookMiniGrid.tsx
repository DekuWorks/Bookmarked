import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { bookDetailsPath } from "@/lib/routes/book";
import type { LibraryBookRow } from "@/lib/services/library";

type Props = {
  items: LibraryBookRow[];
  emptyMessage: string;
  emptyAction?: { label: string; href: string };
};

export function BookMiniGrid({ items, emptyMessage, emptyAction }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
        {emptyMessage}
        {emptyAction ? (
          <>
            {" "}
            <Link href={emptyAction.href} className="font-medium text-primary hover:underline">
              {emptyAction.label}
            </Link>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 items-start gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4">
      {items.map((ub) => {
        const book = ub.books;
        const href = book?.id ? bookDetailsPath(book.id) : undefined;
        const inner = (
          <>
            <div className="relative w-full">
              <BookCover
                title={book?.title ?? "Untitled"}
                author={book?.author}
                coverUrl={book?.cover_url}
                className="w-full"
                sizes="(max-width: 640px) 46vw, (max-width: 768px) 30vw, 160px"
                bookmarked
              />
              {ub.is_favorite ? (
                <span
                  className="absolute bottom-1.5 right-1.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-puce-red shadow-sm"
                  aria-label="Favorite"
                >
                  ★
                </span>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-medium text-text">
              {book?.title ?? "Untitled"}
            </p>
          </>
        );
        return (
          <li key={ub.id}>
            {href ? (
              <Link href={href} className="block transition hover:opacity-90">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}
