import Link from "next/link";
import { BookSpine } from "@/components/library/BookSpine";
import { EmptyShelfMessage } from "@/components/library/EmptyShelfMessage";
import { ShelfTitleRow } from "@/components/shelves/ShelfTitleRow";
import { bookDetailsPath } from "@/lib/routes/book";
import { readerLibraryShelfPath } from "@/lib/routes/readerLibrary";
import { OVERVIEW_SHELF_ACTIONS } from "@bookmarked/utils/overviewCopy";
import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";
import type { LibraryBookRow } from "@/lib/services/library";
import type { ShelfStatus } from "@/types";

type Props = {
  title: string;
  status: ShelfStatus;
  slug: string;
  items: LibraryBookRow[];
  showHeaderLink?: boolean;
  /** When set, "View shelf" links to this reader's public shelf instead of /library. */
  username?: string;
};

export function BookshelfSection({
  title,
  status,
  slug,
  items,
  showHeaderLink = true,
  username,
}: Props) {
  const shelfHref = username
    ? readerLibraryShelfPath(username, slug)
    : withOriginQuery(`/library/${slug}`, { origin: "library_shelf" });

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col items-center justify-center gap-2 border-b border-border px-4 py-3 text-center sm:flex-row sm:justify-between">
        <h2 className="flex items-center gap-2">
          <ShelfTitleRow id={status} title={title} />
          <span className="text-sm font-normal text-text-muted">({items.length})</span>
        </h2>
        {showHeaderLink ? (
          <Link
            href={shelfHref}
            className="text-sm font-medium text-primary hover:underline"
          >
            {OVERVIEW_SHELF_ACTIONS.viewShelf}
          </Link>
        ) : null}
      </div>

      <div className="bookshelf-back px-4 pb-0 pt-5">
        {items.length === 0 ? (
          <EmptyShelfMessage className="pb-6" />
        ) : (
          <div className="bookshelf-row scrollbar-thin">
            {items.map((ub) => {
              const book = ub.books;
              return (
                <BookSpine
                  key={ub.id}
                  title={book?.title ?? "Untitled"}
                  author={book?.author}
                  coverUrl={book?.cover_url}
                  pageCount={book?.page_count}
                  href={book?.id ? bookDetailsPath(book.id) : undefined}
                  bookmarked
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
