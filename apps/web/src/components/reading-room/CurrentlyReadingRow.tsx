import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { bookDetailsPath } from "@/lib/routes/book";
import type { LibraryBookRow } from "@/lib/services/library";

type Props = {
  items: LibraryBookRow[];
};

export function CurrentlyReadingRow({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
        Pick up a book from your{" "}
        <Link href="/search" className="font-medium text-primary hover:underline">
          search
        </Link>{" "}
        or{" "}
        <Link href="/library/want-to-read" className="font-medium text-primary hover:underline">
          want-to-read shelf
        </Link>{" "}
        to start reading.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((ub) => {
        const book = ub.books;
        const percent = Number(ub.progress_percent) || 0;
        return (
          <li
            key={ub.id}
            className="flex gap-4 rounded-xl border border-border bg-background p-4 transition hover:shadow-md"
          >
            <BookCover
              title={book?.title ?? "Untitled"}
              author={book?.author}
              coverUrl={book?.cover_url}
              className="w-20 flex-shrink-0"
              sizes="80px"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <p className="line-clamp-2 font-semibold text-text">
                  {book?.title ?? "Untitled"}
                </p>
                {book?.author ? (
                  <p className="text-sm text-text-muted">{book.author}</p>
                ) : null}
                <div className="mt-2">
                  <ProgressBar value={percent} label={`${Math.round(percent)}%`} />
                </div>
              </div>
              {book?.id ? (
                <ButtonLink
                  href={bookDetailsPath(book.id)}
                  variant="secondary"
                  size="sm"
                  className="mt-3 self-start"
                >
                  Continue reading
                </ButtonLink>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
