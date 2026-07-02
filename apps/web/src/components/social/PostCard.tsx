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
  unlikePost,
} from "@/lib/services/posts";
import type { PostWithAuthor } from "@/types";
import { PostCommentSection } from "@/components/social/PostCommentSection";
import { PostEditPanel } from "@/components/social/PostEditPanel";
import { QuoteRepostModal } from "@/components/social/QuoteRepostModal";
import { RepostPreview } from "@/components/social/RepostPreview";
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

export function PostCard({ post, viewerId, highlighted = false, onPostChange }: Props) {
  const toast = useToast();
  const locale = usePreferredLocale();
  const [expanded, setExpanded] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (!highlighted) return;
    setExpanded(true);
    if (!post.comments) {
      setLoadingComments(true);
      void getPostById(post.id, viewerId)
        .then((updated) => {
          if (updated) setLocalPost(updated);
        })
        .catch(() => {
          // Deep-linked post may be unavailable.
        })
        .finally(() => setLoadingComments(false));
    }
  }, [highlighted, post.id, post.comments, viewerId]);

  const isOwn = localPost.user_id === viewerId;
  const edited =
    localPost.updated_at && localPost.updated_at !== localPost.created_at;
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

  function handleRepostClick() {
    if (localPost.viewer_has_reposted) {
      toast.error("You already reposted this.");
      return;
    }
    setRepostModalOpen(true);
  }

  function handleReposted() {
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
                <Link
                  href={postFeedPath(localPost.id)}
                  className="hover:text-primary hover:underline"
                >
                  <time suppressHydrationWarning dateTime={localPost.created_at}>
                    {formatFeedTimestamp(localPost.created_at, locale)}
                    {edited ? " · edited" : ""}
                  </time>
                </Link>
              </p>
            </div>

            {isOwn ? (
              <span className="ml-auto flex gap-1">
                {!isEditing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={deleting}
                  disabled={isEditing}
                  onClick={() => void handleDelete()}
                >
                  Delete
                </Button>
              </span>
            ) : null}
          </div>

          {isEditing ? (
            <PostEditPanel
              post={localPost}
              viewerId={viewerId}
              onSaved={(updated) => {
                setLocalPost(updated);
                setIsEditing(false);
                onPostChange?.();
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              {localPost.repost_of && !localPost.body.trim() && !localPost.image_url ? (
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
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/40">
                  <Link
                    href={bookDetailsPath(localPost.book.id)}
                    className="h-20 w-14 shrink-0 overflow-hidden rounded-md shadow-sm"
                  >
                    <BookCover
                      title={localPost.book.title}
                      coverUrl={localPost.book.cover_url}
                      className="h-full w-full"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={bookDetailsPath(localPost.book.id)}
                      className="block font-medium text-puce-red hover:underline"
                    >
                      {localPost.book.title}
                    </Link>
                    {localPost.book.author ? (
                      <Link
                        href={authorPagePath(localPost.book.author)}
                        className="text-sm text-text-muted hover:text-primary hover:underline"
                      >
                        {localPost.book.author}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          )}

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
                loading={false}
                disabled={localPost.viewer_has_reposted}
                onClick={handleRepostClick}
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

      {!isOwn ? (
        <QuoteRepostModal
          open={repostModalOpen}
          onClose={() => setRepostModalOpen(false)}
          post={localPost}
          viewerId={viewerId}
          onReposted={handleReposted}
        />
      ) : null}
    </article>
  );
}
