"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { CommentAttachment } from "@/components/social/CommentAttachment";
import { ContentReactionBar } from "@/components/social/ContentReactionBar";
import { MentionComposer } from "@/components/social/MentionComposer";
import { MentionText } from "@/components/social/MentionText";
import { ReplyThread } from "@/components/social/ReplyThread";
import { useToast } from "@/components/ui/Toast";
import { readerProfilePath } from "@/lib/routes/reader";
import {
  addComment,
  deleteComment,
  updateComment,
  validatePostImageFile,
} from "@/lib/services/posts";
import {
  addPostCommentReply,
  deletePostCommentReply,
  dislikePostComment,
  getPostCommentReactionCounts,
  likePostComment,
  listPostCommentReplies,
  uploadCommentAttachment,
} from "@/lib/services/postCommentEngagement";
import { isGiphySearchConfigured, searchGiphy, type GiphySearchResult } from "@/lib/services/giphy";
import { isAllowedPostImageUrl, resolveGiphyImageUrl } from "@/lib/utils/giphy";
import type { PostCommentReplyWithAuthor, PostCommentWithAuthor, ReactionCounts } from "@/types";
import type { ThreadNode } from "@/lib/utils/threadReplies";

type PostCommentReplyNode = Omit<PostCommentReplyWithAuthor, "children">;

type Props = {
  postId: string;
  viewerId: string;
  comments: PostCommentWithAuthor[];
  onCommentsChange?: () => void;
};

function authorLabel(author: PostCommentWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

function CommentItem({
  comment,
  viewerId,
  onCommentsChange,
}: {
  comment: PostCommentWithAuthor;
  viewerId: string;
  onCommentsChange?: () => void;
}) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reactions, setReactions] = useState<ReactionCounts>({
    like_count: 0,
    dislike_count: 0,
    viewer_reaction: null,
  });
  const [reactionLoading, setReactionLoading] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState<ThreadNode<PostCommentReplyNode>[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const isOwn = comment.user_id === viewerId;
  const profileHref = comment.author.username
    ? readerProfilePath(comment.author.username)
    : null;

  const loadReactions = useCallback(async () => {
    const counts = await getPostCommentReactionCounts([comment.id], viewerId);
    const next = counts.get(comment.id);
    if (next) setReactions(next);
  }, [comment.id, viewerId]);

  const loadReplies = useCallback(async () => {
    setRepliesLoading(true);
    try {
      const next = await listPostCommentReplies(comment.id);
      setReplies(next);
    } catch {
      toast.error("Could not load replies.");
    } finally {
      setRepliesLoading(false);
    }
  }, [comment.id, toast]);

  useEffect(() => {
    void loadReactions();
  }, [loadReactions]);

  useEffect(() => {
    if (repliesOpen) void loadReplies();
  }, [repliesOpen, loadReplies]);

  async function handleSave() {
    const trimmed = editBody.trim();
    if (!trimmed && !comment.attachment_url) {
      toast.error("Comment cannot be empty.");
      return;
    }

    setSaving(true);
    const result = await updateComment(comment.id, trimmed);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Comment updated.");
    setIsEditing(false);
    onCommentsChange?.();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteComment(comment.id);
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Comment deleted.");
    onCommentsChange?.();
  }

  async function handleLike() {
    setReactionLoading(true);
    const result = await likePostComment(comment.id);
    setReactionLoading(false);
    if (result.error) toast.error(result.error);
    else if (result.counts) setReactions(result.counts);
  }

  async function handleDislike() {
    setReactionLoading(true);
    const result = await dislikePostComment(comment.id);
    setReactionLoading(false);
    if (result.error) toast.error(result.error);
    else if (result.counts) setReactions(result.counts);
  }

  return (
    <li className="rounded-lg border border-border bg-background/60 p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {profileHref ? (
          <Link href={profileHref} className="text-sm font-semibold text-puce-red hover:underline">
            {authorLabel(comment.author)}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-puce-red">{authorLabel(comment.author)}</span>
        )}
        {isOwn && !isEditing ? (
          <span className="ml-auto flex gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </span>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="mb-0 min-h-[80px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" size="sm" loading={saving} onClick={() => void handleSave()}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditBody(comment.body);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {comment.attachment_url ? (
            <CommentAttachment url={comment.attachment_url} />
          ) : null}
          {comment.body.trim() ? (
            <p className="text-sm leading-relaxed text-text">
              <MentionText body={comment.body} />
            </p>
          ) : null}
        </div>
      )}

      <p className="mt-1 text-xs text-text-muted">
        <time suppressHydrationWarning dateTime={comment.created_at}>
          {new Date(comment.created_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      </p>

      {!isEditing ? (
        <div className="mt-2 border-t border-border pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <ContentReactionBar
              likeCount={reactions.like_count}
              dislikeCount={reactions.dislike_count}
              viewerReaction={reactions.viewer_reaction}
              onLike={() => void handleLike()}
              onDislike={() => void handleDislike()}
              loading={reactionLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRepliesOpen((open) => !open)}
            >
              {repliesOpen ? "Hide replies" : "Reply"}
            </Button>
          </div>

          {repliesOpen ? (
            <div className="mt-3">
              {repliesLoading ? (
                <p className="text-sm text-text-muted">Loading replies…</p>
              ) : (
                <ReplyThread
                  replies={replies}
                  viewerId={viewerId}
                  onSubmitReply={(body, parentReplyId) =>
                    addPostCommentReply(comment.id, body, parentReplyId)
                  }
                  onDeleteReply={deletePostCommentReply}
                  onRefresh={() => void loadReplies()}
                  composerPlaceholder="Reply to this comment…"
                />
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function PostCommentSection({
  postId,
  viewerId,
  comments,
  onCommentsChange,
}: Props) {
  const toast = useToast();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifInput, setGifInput] = useState("");
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifSearchResults, setGifSearchResults] = useState<GiphySearchResult[]>([]);
  const [gifSearchLoading, setGifSearchLoading] = useState(false);
  const gifSearchEnabled = isGiphySearchConfigured();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const query = gifSearchQuery.trim();
    if (!query || !gifSearchEnabled) {
      setGifSearchResults([]);
      setGifSearchLoading(false);
      return;
    }

    const handle = window.setTimeout(() => {
      setGifSearchLoading(true);
      void searchGiphy(query)
        .then(setGifSearchResults)
        .catch(() => setGifSearchResults([]))
        .finally(() => setGifSearchLoading(false));
    }, 350);

    return () => window.clearTimeout(handle);
  }, [gifSearchQuery, gifSearchEnabled]);

  function clearImage() {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  }

  function clearGif() {
    setGifUrl(null);
    setGifInput("");
  }

  function clearAttachments() {
    clearImage();
    clearGif();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validatePostImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    clearGif();
    clearImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function applyGifUrl(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      clearGif();
      return;
    }

    if (!isAllowedPostImageUrl(trimmed)) {
      toast.error("Paste a valid Giphy link (giphy.com or media.giphy.com).");
      return;
    }

    const resolved = resolveGiphyImageUrl(trimmed);
    if (!resolved) {
      toast.error("Could not read that Giphy link.");
      return;
    }

    clearImage();
    setGifUrl(resolved);
    setGifInput(trimmed);
  }

  function selectGif(result: GiphySearchResult) {
    clearImage();
    setGifUrl(result.imageUrl);
    setGifInput(result.imageUrl);
    setGifSearchQuery("");
    setGifSearchResults([]);
  }

  async function resolveAttachmentUrl(): Promise<{ url: string | null; error?: string }> {
    if (imageFile) {
      const uploadResult = await uploadCommentAttachment(imageFile);
      if (uploadResult.error) return { url: null, error: uploadResult.error };
      return { url: uploadResult.url ?? null };
    }

    return { url: gifUrl };
  }

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed && !imageFile && !gifUrl) {
      toast.error("Write a comment or attach an image or GIF.");
      return;
    }

    setSubmitting(true);
    const attachmentResult = await resolveAttachmentUrl();
    if (attachmentResult.error) {
      setSubmitting(false);
      toast.error(attachmentResult.error);
      return;
    }

    const result = await addComment(postId, trimmed, attachmentResult.url);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setBody("");
    clearAttachments();
    onCommentsChange?.();
  }

  const canSubmit = Boolean(body.trim() || imageFile || gifUrl);

  return (
    <div className="mt-3 border-t border-border pt-3">
      {comments.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              viewerId={viewerId}
              onCommentsChange={onCommentsChange}
            />
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-text-muted">No comments yet. Start the conversation.</p>
      )}

      <div className="space-y-2">
        <MentionComposer
          value={body}
          onChange={setBody}
          viewerId={viewerId}
          placeholder="Write a comment… Use @ to mention someone."
        />

        {imagePreview ? (
          <div className="relative inline-block w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Comment image preview"
              className="max-h-40 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
              aria-label="Remove image"
            >
              Remove
            </button>
          </div>
        ) : null}

        {gifUrl && !imagePreview ? (
          <div className="relative inline-block w-fit max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gifUrl}
              alt="Comment GIF preview"
              className="max-h-40 rounded-lg border border-border object-contain bg-background"
            />
            <button
              type="button"
              onClick={clearGif}
              className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
              aria-label="Remove GIF"
            >
              Remove
            </button>
          </div>
        ) : null}

        <details className="rounded-lg border border-border bg-background/50 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-text">Add a GIF (optional)</summary>
          <div className="mt-3 space-y-3">
            <Input
              label="Giphy URL"
              value={gifInput}
              onChange={(e) => setGifInput(e.target.value)}
              onBlur={() => applyGifUrl(gifInput)}
              placeholder="Paste a giphy.com link"
              className="mb-0"
            />
            {gifSearchEnabled ? (
              <div>
                <Input
                  label="Search Giphy"
                  value={gifSearchQuery}
                  onChange={(e) => setGifSearchQuery(e.target.value)}
                  placeholder="Search for a GIF"
                  className="mb-0"
                />
                {gifSearchLoading ? (
                  <p className="mt-2 text-xs text-text-muted">Searching…</p>
                ) : gifSearchResults.length > 0 ? (
                  <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {gifSearchResults.map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => selectGif(result)}
                          className="block w-full overflow-hidden rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
                          title={result.title}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={result.previewUrl}
                            alt={result.title}
                            className="aspect-square w-full object-cover"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
              disabled={submitting}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting || Boolean(gifUrl)}
              aria-label="Attach image"
            >
              Attach image
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={submitting}
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
