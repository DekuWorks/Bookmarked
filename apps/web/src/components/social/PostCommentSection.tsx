"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { readerProfilePath } from "@/lib/routes/reader";
import {
  addComment,
  deleteComment,
  updateComment,
} from "@/lib/services/posts";
import type { PostCommentWithAuthor } from "@/types";

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
  const isOwn = comment.user_id === viewerId;
  const profileHref = comment.author.username
    ? readerProfilePath(comment.author.username)
    : null;

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
        <p className="text-sm leading-relaxed text-text">{comment.body}</p>
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
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="mb-0 min-h-[80px]"
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
