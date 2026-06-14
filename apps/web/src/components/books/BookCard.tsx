import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
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
  className,
}: Props) {
  const content = (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:shadow-md",
        href && "cursor-pointer",
        className
      )}
    >
      <BookCover title={title} author={author} coverUrl={coverUrl} className="rounded-none border-0" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        {shelfStatus ? <ShelfBadge status={shelfStatus} /> : null}
        <h3 className="line-clamp-2 font-semibold text-text">{title}</h3>
        {author ? (
          <p className="line-clamp-1 text-sm text-text-muted">{author}</p>
        ) : null}
        {progressPercent !== undefined && progressPercent > 0 ? (
          <ProgressBar value={progressPercent} label={`${Math.round(progressPercent)}% complete`} />
        ) : null}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
