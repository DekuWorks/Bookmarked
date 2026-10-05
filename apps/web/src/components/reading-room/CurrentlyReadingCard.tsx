import { BookCover } from "@/components/books/BookCover";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { bookDetailsPath } from "@/lib/routes/book";
import type { LibraryBookRow } from "@/lib/services/library";
import { currentlyReadingProgressLabel } from "@bookmarked/utils/overviewShelfPreview";

type Props = {
  item: LibraryBookRow;
};

export function CurrentlyReadingCard({ item }: Props) {
  const book = item.books;
  const title = book?.title ?? "Untitled";
  const progress = currentlyReadingProgressLabel({
    progressPages: item.progress_pages,
    totalPages: item.total_pages,
    pageCount: book?.page_count ?? null,
    progressPercent: item.progress_percent,
  });
  const href = book?.id
    ? bookDetailsPath(book.id, { origin: "reading_room_overview" })
    : null;

  return (
    <article className="flex h-full min-h-[220px] gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm md:gap-6 md:p-5">
      <div className="w-24 shrink-0 self-start md:w-32">
        <BookCover
          title={title}
          author={book?.author}
          coverUrl={book?.cover_url}
          alt={`${title} cover`}
          objectFit="contain"
          sizes="128px"
          className="shadow-sm"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 font-display text-xl font-semibold leading-snug text-text md:text-2xl">
          {title}
        </h3>
        {book?.author ? (
          <p className="mt-1 line-clamp-1 text-sm text-text-muted">{book.author}</p>
        ) : null}
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text-muted">Progress</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-puce-red">{progress.value}</p>
        <div
          className="mt-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-label={`Progress, ${progress.value}`}
        >
          <ProgressBar value={progress.percent} />
        </div>
        {href ? (
          <ButtonLink href={href} variant="primary" size="sm" className="mt-4 w-full md:mt-auto">
            Update Progress
          </ButtonLink>
        ) : null}
      </div>
    </article>
  );
}
