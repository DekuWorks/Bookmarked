"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
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
} from "@/lib/services/posts";
import {
  addPostCommentReply,
  deletePostCommentReply,
  dislikePostComment,
  getPostCommentReactionCounts,
  likePostComment,
  listPostCommentReplies,
} from "@/lib/services/postCommentEngagement";
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
    if (!trimmed) {
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
        <p className="text-sm leading-relaxed text-text">
          <MentionText body={comment.body} />
        </p>
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
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error("Write a comment first.");
      return;
    }

    setSubmitting(true);
    const result = await addComment(postId, trimmed);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setBody("");
    onCommentsChange?.();
  }

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
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={submitting}
            onClick={() => void handleSubmit()}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
