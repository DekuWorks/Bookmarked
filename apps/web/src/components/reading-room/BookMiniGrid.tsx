import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
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
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((ub) => {
        const book = ub.books;
        const href = book?.id ? `/book/${book.id}` : undefined;
        const inner = (
          <>
            <BookCover
              title={book?.title ?? "Untitled"}
              coverUrl={book?.cover_url}
              className="w-full"
              sizes="120px"
            />
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
