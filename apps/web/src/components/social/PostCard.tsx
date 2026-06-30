"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { useToast } from "@/components/ui/Toast";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { postFeedPath } from "@/lib/routes/posts";
import { readerProfilePath } from "@/lib/routes/reader";
import {
  deletePost,
  getPostById,
  likePost,
  repostPost,
  unlikePost,
} from "@/lib/services/posts";
import type { PostWithAuthor } from "@/types";
import { PostCommentSection } from "@/components/social/PostCommentSection";
import { MentionText } from "@/components/social/MentionText";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { isGiphyImageUrl } from "@/lib/utils/giphy";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import { cn } from "@/lib/utils/cn";

type Props = {
  post: PostWithAuthor;
  viewerId: string;
  highlighted?: boolean;
  onPostChange?: () => void;
};

function authorLabel(author: PostWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

function RepostPreview({ post }: { post: PostWithAuthor }) {
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

export function PostCard({ post, viewerId, highlighted = false, onPostChange }: Props) {
  const toast = useToast();
  const locale = usePreferredLocale();
  const [expanded, setExpanded] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const isOwn = localPost.user_id === viewerId;
  const profileHref = localPost.author.username
    ? readerProfilePath(localPost.author.username)
    : null;

  async function refreshPost(withComments = expanded) {
    const updated = await getPostById(localPost.id, viewerId);
    if (updated) setLocalPost(updated);
    onPostChange?.();
    return updated;
  }

  async function handleLikeToggle() {
    setLiking(true);
    const result = localPost.viewer_has_liked
      ? await unlikePost(localPost.id)
      : await likePost(localPost.id);
    setLiking(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setLocalPost((current) => ({
      ...current,
      viewer_has_liked: !current.viewer_has_liked,
      like_count: current.viewer_has_liked
        ? Math.max(0, current.like_count - 1)
        : current.like_count + 1,
    }));
  }

  async function handleRepost() {
    if (localPost.viewer_has_reposted) {
      toast.error("You already reposted this.");
      return;
    }

    setReposting(true);
    const result = await repostPost(localPost.id);
    setReposting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Reposted.");
    setLocalPost((current) => ({ ...current, viewer_has_reposted: true }));
    onPostChange?.();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deletePost(localPost.id);
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Post deleted.");
    onPostChange?.();
  }

  async function handleToggleComments() {
    const next = !expanded;
    setExpanded(next);

    if (next && !localPost.comments) {
      setLoadingComments(true);
      try {
        await refreshPost(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load comments.");
      } finally {
        setLoadingComments(false);
      }
    }
  }

  return (
    <article
      id={`post-${localPost.id}`}
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-sm transition",
        highlighted && "ring-2 ring-royal-orange"
      )}
    >
      <div className="flex gap-3">
        {profileHref ? (
          <Link href={profileHref} className="shrink-0">
            <ProfileAvatar profile={localPost.author} size="md" />
          </Link>
        ) : (
          <ProfileAvatar profile={localPost.author} size="md" className="shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
            <div>
              {profileHref ? (
                <Link href={profileHref} className="font-semibold text-puce-red hover:underline">
                  {authorLabel(localPost.author)}
                </Link>
              ) : (
                <span className="font-semibold text-puce-red">{authorLabel(localPost.author)}</span>
              )}
              <p className="text-xs text-text-muted">
                <time suppressHydrationWarning dateTime={localPost.created_at}>
                  {formatFeedTimestamp(localPost.created_at, locale)}
                </time>
              </p>
            </div>

            {isOwn ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                loading={deleting}
                onClick={() => void handleDelete()}
              >
                Delete
              </Button>
            ) : null}
          </div>

          {localPost.repost_of ? (
            <p className="mt-2 text-xs font-medium text-text-muted">Reposted</p>
          ) : null}

          {localPost.body.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-text">
              <MentionText body={localPost.body} />
            </p>
          ) : null}

          {localPost.image_url ? (
            <a
              href={localPost.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block overflow-hidden rounded-lg border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localPost.image_url}
                alt={isGiphyImageUrl(localPost.image_url) ? "Post GIF" : "Post image"}
                className={cn(
                  "w-full",
                  isGiphyImageUrl(localPost.image_url)
                    ? "max-h-96 object-contain bg-background"
                    : "max-h-96 object-cover"
                )}
              />
            </a>
          ) : null}

          {localPost.repost_of ? (
            <div className="mt-3">
              <RepostPreview post={localPost.repost_of} />
            </div>
          ) : null}

          {localPost.book ? (
            <Link
              href={bookDetailsPath(localPost.book.id)}
              className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/40"
            >
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md shadow-sm">
                <BookCover
                  title={localPost.book.title}
                  coverUrl={localPost.book.cover_url}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-puce-red">{localPost.book.title}</p>
                {localPost.book.author ? (
                  <Link
                    href={authorPagePath(localPost.book.author)}
                    className="text-sm text-text-muted hover:text-primary hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {localPost.book.author}
                  </Link>
                ) : null}
              </div>
            </Link>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={localPost.viewer_has_liked ? "secondary" : "outline"}
              size="sm"
              loading={liking}
              onClick={() => void handleLikeToggle()}
              aria-pressed={localPost.viewer_has_liked}
            >
              {localPost.viewer_has_liked ? "Liked" : "Like"}
              {localPost.like_count > 0 ? ` · ${localPost.like_count}` : ""}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleToggleComments()}
            >
              {expanded ? "Hide comments" : "Comments"}
              {localPost.comment_count > 0 ? ` · ${localPost.comment_count}` : ""}
            </Button>

            {!isOwn ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={reposting}
                disabled={localPost.viewer_has_reposted}
                onClick={() => void handleRepost()}
              >
                {localPost.viewer_has_reposted ? "Reposted" : "Repost"}
              </Button>
            ) : null}

            <CopyLinkButton path={postFeedPath(localPost.id)} label="Share" variant="ghost" size="sm" />
          </div>

          {expanded ? (
            loadingComments ? (
              <p className="mt-3 text-sm text-text-muted">Loading comments…</p>
            ) : (
              <PostCommentSection
                postId={localPost.id}
                viewerId={viewerId}
                comments={localPost.comments ?? []}
                onCommentsChange={() => void refreshPost(true)}
              />
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
