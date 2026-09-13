import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { bookDetailsPath, type BookPathOrigin } from "@/lib/routes/book";
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
  originExtras?: BookPathOrigin;
  interactive?: boolean;
};

export function FeedBookAttachment({
  book,
  className,
  variant = "default",
  originExtras,
  interactive = true,
}: Props) {
  const compact = variant === "compact";
  const coverClass = compact ? "h-20 w-14" : "h-28 w-[4.5rem]";

  const href = bookDetailsPath(book.id, originExtras);
  const label = book.author ? `${book.title} by ${book.author}` : book.title;
  const Wrapper = interactive ? Link : "div";
  const wrapperProps = interactive
    ? { href, "aria-label": label }
    : { role: "group", "aria-label": label };

  return (
    <Wrapper
      {...(wrapperProps as { href: string; "aria-label": string })}
      className={cn(
        "block overflow-visible rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-surface transition hover:border-primary/45 hover:shadow-sm",
        className
      )}
    >
      <div className={cn("flex items-stretch gap-4", compact ? "p-2.5" : "p-3.5")}>
        <div className={cn("relative shrink-0 overflow-visible rounded-lg shadow-sm", coverClass)}>
          <BookCover
            title={book.title}
            coverUrl={book.cover_url}
            className="h-full w-full"
            bookmarked
            bookmarkBadgeSize={compact ? "small" : "medium"}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-royal-orange">
            Book
          </p>
          <p
            className={cn(
              "mt-1 font-semibold leading-snug text-puce-red",
              compact ? "line-clamp-2 text-sm" : "line-clamp-3 text-base"
            )}
          >
            {book.title}
          </p>
          {book.author ? (
            <p
              className={cn(
                "mt-1 text-text-muted",
                compact ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm"
              )}
            >
              {book.author}
            </p>
          ) : null}
        </div>
      </div>
    </Wrapper>
  );
}
