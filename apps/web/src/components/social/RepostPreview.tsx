"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCover } from "@/components/books/BookCover";
import { MentionText } from "@/components/social/MentionText";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { postFeedPath } from "@/lib/routes/posts";
import { readerProfilePath } from "@/lib/routes/reader";
import type { PostWithAuthor } from "@/types";
import { isGiphyImageUrl } from "@/lib/utils/giphy";
import { cn } from "@/lib/utils/cn";

function authorLabel(author: PostWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

type Props = {
  post: PostWithAuthor;
  linkToPost?: boolean;
};

export function RepostPreview({ post, linkToPost = true }: Props) {
  const router = useRouter();
  const profileHref = post.author.username
    ? readerProfilePath(post.author.username)
    : null;
  const postHref = postFeedPath(post.id);

  const content = (
    <>
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-xs text-text-muted">
          {profileHref ? (
            <Link href={profileHref} className="font-semibold text-puce-red hover:underline">
              {authorLabel(post.author)}
            </Link>
          ) : (
            <span className="font-semibold text-puce-red">{authorLabel(post.author)}</span>
          )}
        </p>
        {linkToPost ? (
          <Link href={postHref} className="shrink-0 text-xs font-medium text-primary hover:underline">
            View post
          </Link>
        ) : null}
      </div>
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
          onClick={(event) => event.stopPropagation()}
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
        <div
          className="mt-2 flex items-center gap-3 rounded-md border border-border p-2 hover:border-primary/40"
          onClick={(event) => event.stopPropagation()}
        >
          <Link
            href={bookDetailsPath(post.book.id)}
            className="h-16 w-11 shrink-0 overflow-hidden rounded shadow-sm"
          >
            <BookCover title={post.book.title} coverUrl={post.book.cover_url} className="h-full w-full" />
          </Link>
          <div className="min-w-0">
            <Link
              href={bookDetailsPath(post.book.id)}
              className="block truncate text-sm font-medium text-puce-red hover:underline"
            >
              {post.book.title}
            </Link>
            {post.book.author ? (
              <Link
                href={authorPagePath(post.book.author)}
                className="block truncate text-xs text-text-muted hover:text-primary hover:underline"
              >
                {post.book.author}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );

  if (!linkToPost) {
    return (
      <div className="rounded-lg border border-border bg-background/60 p-3">{content}</div>
    );
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(postHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(postHref);
        }
      }}
      className="cursor-pointer rounded-lg border border-border bg-background/60 p-3 transition hover:border-primary/40 hover:bg-background"
    >
      {content}
    </div>
  );
}
