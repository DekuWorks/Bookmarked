"use client";

import { useState } from "react";
import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { deleteDiscussion } from "@/lib/services/bookClubs";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { readerProfilePath } from "@/lib/routes/reader";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import type { BookClubPostWithAuthor } from "@/types";

type Props = {
  post: BookClubPostWithAuthor;
  viewerId: string;
  onDeleted?: () => void;
};

function authorLabel(author: BookClubPostWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

export function ClubDiscussionCard({ post, viewerId, onDeleted }: Props) {
  const toast = useToast();
  const locale = usePreferredLocale();
  const [deleting, setDeleting] = useState(false);

  const isOwn = post.user_id === viewerId;
  const profileHref = post.author.username ? readerProfilePath(post.author.username) : null;

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteDiscussion(post.id);
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Discussion deleted.");
    onDeleted?.();
  }

  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex gap-3">
        {profileHref ? (
          <Link href={profileHref} className="shrink-0">
            <ProfileAvatar profile={post.author} size="md" />
          </Link>
        ) : (
          <ProfileAvatar profile={post.author} size="md" className="shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
            <div className="min-w-0">
              <p className="text-sm">
                {profileHref ? (
                  <Link href={profileHref} className="font-semibold text-puce-red hover:underline">
                    {authorLabel(post.author)}
                  </Link>
                ) : (
                  <span className="font-semibold text-puce-red">{authorLabel(post.author)}</span>
                )}
                <span className="text-text-muted"> started a discussion</span>
              </p>
              <p className="text-xs text-text-muted">
                <time suppressHydrationWarning dateTime={post.created_at}>
                  {formatFeedTimestamp(post.created_at, locale)}
                </time>
              </p>
            </div>

            {isOwn ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={deleting}
                onClick={() => void handleDelete()}
                className="ml-auto"
              >
                Delete
              </Button>
            ) : null}
          </div>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">{post.body}</p>

          {post.book ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/40">
              <Link
                href={bookDetailsPath(post.book.id)}
                className="h-20 w-14 shrink-0 overflow-hidden rounded-md shadow-sm"
              >
                <BookCover
                  title={post.book.title}
                  author={post.book.author}
                  coverUrl={post.book.cover_url}
                  className="h-full w-full"
                  bookmarked
                  bookmarkBadgeSize="md"
                />
              </Link>
              <div className="min-w-0">
                <Link
                  href={bookDetailsPath(post.book.id)}
                  className="block font-medium text-puce-red hover:underline"
                >
                  {post.book.title}
                </Link>
                {post.book.author ? (
                  <Link
                    href={authorPagePath(post.book.author)}
                    className="text-sm text-text-muted hover:text-primary hover:underline"
                  >
                    {post.book.author}
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
