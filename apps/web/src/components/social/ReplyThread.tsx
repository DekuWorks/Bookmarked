"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CommentAttachment } from "@/components/social/CommentAttachment";
import {
  CommentAttachmentControls,
  useCommentAttachment,
} from "@/components/social/CommentAttachmentControls";
import { MentionComposer } from "@/components/social/MentionComposer";
import { MentionText } from "@/components/social/MentionText";
import { useToast } from "@/components/ui/Toast";
import { readerProfilePath } from "@/lib/routes/reader";
import type { PostAuthor } from "@/types";
import type { ThreadNode } from "@/lib/utils/threadReplies";
import { cn } from "@/lib/utils/cn";

type ReplyAuthor = PostAuthor;

type ReplyNode = {
  id: string;
  user_id: string;
  body: string;
  attachment_url?: string | null;
  created_at: string;
  parent_reply_id: string | null;
  author: ReplyAuthor;
};

type Props<T extends ReplyNode> = {
  replies: ThreadNode<T>[];
  viewerId: string;
  onSubmitReply: (
    body: string,
    parentReplyId?: string | null,
    attachmentUrl?: string | null
  ) => Promise<{ error?: string }>;
  onDeleteReply: (replyId: string) => Promise<{ error?: string }>;
  onRefresh?: () => void;
  showComposer?: boolean;
  composerPlaceholder?: string;
};

function authorLabel(author: ReplyAuthor): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

function ReplyComposer({
  viewerId,
  placeholder,
  submitting,
  onCancel,
  onSubmit,
}: {
  viewerId: string;
  placeholder: string;
  submitting: boolean;
  onCancel?: () => void;
  onSubmit: (body: string, attachmentUrl: string | null) => Promise<void>;
}) {
  const toast = useToast();
  const [body, setBody] = useState("");
  const attachment = useCommentAttachment();

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed && !attachment.hasAttachment) {
      toast.error("Write a reply or attach an image or GIF.");
      return;
    }

    const attachmentResult = await attachment.resolveAttachmentUrl();
    if (attachmentResult.error) {
      toast.error(attachmentResult.error);
      return;
    }

    await onSubmit(trimmed, attachmentResult.url);
    setBody("");
    attachment.clearAttachment();
  }

  const canSubmit = Boolean(body.trim() || attachment.hasAttachment);

  return (
    <div className="space-y-2">
      <MentionComposer
        value={body}
        onChange={setBody}
        viewerId={viewerId}
        placeholder={placeholder}
        minHeightClassName="min-h-[64px]"
      />
      <CommentAttachmentControls {...attachment} disabled={submitting} />
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={submitting}
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
        >
          Reply
        </Button>
      </div>
    </div>
  );
}

function ReplyItem<T extends ReplyNode>({
  reply,
  depth,
  viewerId,
  onSubmitReply,
  onDeleteReply,
  onRefresh,
}: {
  reply: ThreadNode<T>;
  depth: number;
  viewerId: string;
  onSubmitReply: Props<T>["onSubmitReply"];
  onDeleteReply: Props<T>["onDeleteReply"];
  onRefresh?: () => void;
}) {
  const toast = useToast();
  const [replyOpen, setReplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwn = reply.user_id === viewerId;
  const profileHref = reply.author.username ? readerProfilePath(reply.author.username) : null;

  async function handleReplySubmit(body: string, attachmentUrl: string | null) {
    setSubmitting(true);
    const result = await onSubmitReply(body, reply.id, attachmentUrl);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setReplyOpen(false);
    onRefresh?.();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await onDeleteReply(reply.id);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onRefresh?.();
  }

  return (
    <li className={cn(depth > 0 && "ml-4 border-l border-border pl-3")}>
      <div className="rounded-lg border border-border bg-background/60 p-3">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {profileHref ? (
            <Link href={profileHref} className="text-sm font-semibold text-puce-red hover:underline">
              {authorLabel(reply.author)}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-puce-red">{authorLabel(reply.author)}</span>
          )}
          {isOwn ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={deleting}
              className="ml-auto"
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          {reply.attachment_url ? <CommentAttachment url={reply.attachment_url} /> : null}
          {reply.body.trim() ? (
            <p className="text-sm leading-relaxed text-text">
              <MentionText body={reply.body} />
            </p>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-xs text-text-muted">
            <time suppressHydrationWarning dateTime={reply.created_at}>
              {new Date(reply.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </time>
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setReplyOpen((open) => !open)}>
            Reply
          </Button>
        </div>

        {replyOpen ? (
          <div className="mt-2">
            <ReplyComposer
              viewerId={viewerId}
              placeholder={`Reply to @${reply.author.username ?? "reader"}…`}
              submitting={submitting}
              onCancel={() => setReplyOpen(false)}
              onSubmit={handleReplySubmit}
            />
          </div>
        ) : null}
      </div>

      {reply.children.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {reply.children.map((child) => (
            <ReplyItem
              key={child.id}
              reply={child}
              depth={depth + 1}
              viewerId={viewerId}
              onSubmitReply={onSubmitReply}
              onDeleteReply={onDeleteReply}
              onRefresh={onRefresh}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ReplyThread<T extends ReplyNode>({
  replies,
  viewerId,
  onSubmitReply,
  onDeleteReply,
  onRefresh,
  showComposer = true,
  composerPlaceholder = "Write a reply…",
}: Props<T>) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleTopLevelSubmit(body: string, attachmentUrl: string | null) {
    setSubmitting(true);
    const result = await onSubmitReply(body, null, attachmentUrl);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    onRefresh?.();
  }

  return (
    <div className="space-y-3">
      {replies.length > 0 ? (
        <ul className="space-y-2">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              depth={0}
              viewerId={viewerId}
              onSubmitReply={onSubmitReply}
              onDeleteReply={onDeleteReply}
              onRefresh={onRefresh}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">No replies yet.</p>
      )}

      {showComposer ? (
        <ReplyComposer
          viewerId={viewerId}
          placeholder={composerPlaceholder}
          submitting={submitting}
          onSubmit={handleTopLevelSubmit}
        />
      ) : null}
    </div>
  );
}
