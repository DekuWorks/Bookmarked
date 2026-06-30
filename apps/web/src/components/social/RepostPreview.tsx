import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { MentionText } from "@/components/social/MentionText";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { readerProfilePath } from "@/lib/routes/reader";
import type { PostWithAuthor } from "@/types";
import { isGiphyImageUrl } from "@/lib/utils/giphy";
import { cn } from "@/lib/utils/cn";

function authorLabel(author: PostWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

export function RepostPreview({ post }: { post: PostWithAuthor }) {
  const profileHref = post.author.username
    ? readerProfilePath(post.author.username)
    : null;

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <p className="mb-1 text-xs text-text-muted">
        {profileHref ? (
          <Link href={profileHref} className="font-semibold text-puce-red hover:underline">
            {authorLabel(post.author)}
          </Link>
        ) : (
          <span className="font-semibold text-puce-red">{authorLabel(post.author)}</span>
        )}
      </p>
      {post.body.trim() ? (
        <p className="text-sm leading-relaxed text-text">
          <MentionText body={post.body} />
        </p>
      ) : null}
      {post.image_url ? (
        <a
          href={post.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block overflow-hidden rounded-md border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={isGiphyImageUrl(post.image_url) ? "Post GIF" : "Post image"}
            className={cn(
              "w-full",
              isGiphyImageUrl(post.image_url)
                ? "max-h-48 object-contain bg-background"
                : "max-h-48 object-cover"
            )}
          />
        </a>
      ) : null}
      {post.book ? (
        <Link
          href={bookDetailsPath(post.book.id)}
          className="mt-2 flex items-center gap-3 rounded-md border border-border p-2 hover:border-primary/40"
        >
          <div className="h-16 w-11 shrink-0 overflow-hidden rounded shadow-sm">
            <BookCover title={post.book.title} coverUrl={post.book.cover_url} className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-puce-red">{post.book.title}</p>
            {post.book.author ? (
              <Link
                href={authorPagePath(post.book.author)}
                className="truncate text-xs text-text-muted hover:text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {post.book.author}
              </Link>
            ) : null}
          </div>
        </Link>
      ) : null}
    </div>
  );
}
