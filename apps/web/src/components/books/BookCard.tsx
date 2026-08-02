import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { authorPagePath } from "@/lib/routes/author";
import type { ShelfStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  id?: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  href?: string;
  shelfStatus?: ShelfStatus;
  progressPercent?: number;
  format?: "book" | "ebook" | "audiobook" | null;
  className?: string;
};

export function BookCard({
  id,
  title,
  author,
  coverUrl,
  href,
  shelfStatus,
  progressPercent,
  format,
  className,
}: Props) {
  const cover = (
    <BookCover
      title={title}
      author={author}
      coverUrl={coverUrl}
      className="rounded-none border-0"
      bookmarked={Boolean(shelfStatus)}
    />
  );

  return (
    <article
      className={cn(
        "flex flex-col overflow-visible rounded-xl border border-border bg-surface shadow-sm transition hover:shadow-md",
        className
      )}
    >
      {href ? <Link href={href}>{cover}</Link> : cover}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {shelfStatus ? <ShelfBadge status={shelfStatus} /> : null}
          {format === "audiobook" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-puce-red">
              🎧 Audiobook
            </span>
          ) : null}
        </div>
        {href ? (
          <Link href={href}>
            <h3 className="mt-0.5 line-clamp-2 font-display text-base font-bold leading-snug tracking-tight text-text hover:text-primary sm:text-lg">
              {title}
            </h3>
          </Link>
        ) : (
          <h3 className="mt-0.5 line-clamp-2 font-display text-base font-bold leading-snug tracking-tight text-text sm:text-lg">
            {title}
          </h3>
        )}
        {author ? (
          <p className="line-clamp-1 text-[13px] leading-snug text-text-muted sm:text-sm">
            <Link href={authorPagePath(author)} className="hover:text-primary hover:underline">
              {author}
            </Link>
          </p>
        ) : null}
        {progressPercent !== undefined && progressPercent > 0 ? (
          <ProgressBar value={progressPercent} label={`${Math.round(progressPercent)}% complete`} />
        ) : null}
      </div>
    </article>
  );
}
