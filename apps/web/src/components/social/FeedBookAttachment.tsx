import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { authorPagePath } from "@/lib/routes/author";
import { bookDetailsPath } from "@/lib/routes/book";
import { cn } from "@/lib/utils/cn";

type BookRef = {
  id: string;
  title: string;
  author?: string | null;
  cover_url?: string | null;
};

type Props = {
  book: BookRef;
  className?: string;
  /** Compact for repost previews; default for feed posts. */
  variant?: "default" | "compact";
};

export function FeedBookAttachment({ book, className, variant = "default" }: Props) {
  const compact = variant === "compact";
  const coverClass = compact ? "h-20 w-14" : "h-28 w-[4.5rem]";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-surface transition hover:border-primary/45 hover:shadow-sm",
        className
      )}
    >
      <div className={cn("flex items-stretch gap-4", compact ? "p-2.5" : "p-3.5")}>
        <Link
          href={bookDetailsPath(book.id)}
          className={cn("relative shrink-0 overflow-hidden rounded-lg shadow-sm", coverClass)}
        >
          <BookCover
            title={book.title}
            coverUrl={book.cover_url}
            className="h-full w-full"
            bookmarked
            bookmarkBadgeSize={compact ? "small" : "medium"}
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-royal-orange">
            Book
          </p>
          <Link
            href={bookDetailsPath(book.id)}
            className={cn(
              "mt-1 font-semibold leading-snug text-puce-red hover:underline",
              compact ? "line-clamp-2 text-sm" : "line-clamp-3 text-base"
            )}
          >
            {book.title}
          </Link>
          {book.author ? (
            <Link
              href={authorPagePath(book.author)}
              className={cn(
                "mt-1 text-text-muted hover:text-primary hover:underline",
                compact ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm"
              )}
            >
              {book.author}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
