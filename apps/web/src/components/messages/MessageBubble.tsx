"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { MessageReactionBar } from "@/components/messages/MessageReactionBar";
import { MessageReactionPicker } from "@/components/messages/MessageReactionPicker";
import { MessageReplyPreview } from "@/components/messages/MessageReplyPreview";
import { CommentAttachment } from "@/components/social/CommentAttachment";
import { formatMessageTimestamp } from "@/lib/services/messages";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { profileDisplayName } from "@/lib/utils/messaging";
import type { MessageWithSender } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  message: MessageWithSender;
  isOwn: boolean;
  showSenderName: boolean;
  participantNames: Map<string, string>;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, body: string) => Promise<{ error?: string }>;
  onReply?: (message: MessageWithSender) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
};

const actionButtonClass =
  "inline-flex min-h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-medium text-text-muted transition hover:bg-background hover:text-text";

export function MessageBubble({
  message,
  isOwn,
  showSenderName,
  participantNames,
  onDelete,
  onEdit,
  onReply,
  onToggleReaction,
}: Props) {
  const locale = usePreferredLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const edited =
    message.updated_at &&
    message.updated_at !== message.created_at;

  const hasReply = Boolean(message.reply_to);
  const hasAttachment = Boolean(message.attachment_url);
  const hasBody = Boolean(message.body?.trim());
  const isAttachmentOnly = hasAttachment && !hasBody && !hasReply;

  async function handleSave() {
    if (!onEdit) return;

    const trimmed = draft.trim();
    if (!trimmed) {
      setEditError("Message cannot be empty.");
      return;
    }

    setSaving(true);
    setEditError(null);
    const result = await onEdit(message.id, trimmed);
    setSaving(false);

    if (result.error) {
      setEditError(result.error);
      return;
    }

    setIsEditing(false);
  }

  function handleCancelEdit() {
    setDraft(message.body);
    setEditError(null);
    setIsEditing(false);
  }

  const canInteract = !isEditing;
  const showActions = canInteract && (onReply || onToggleReaction || onDelete || onEdit);
  const showReactions =
    canInteract && Boolean(onToggleReaction) && Boolean(message.reactions?.length);

  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      {showSenderName && !isOwn ? (
        <span className="px-1 text-xs font-medium text-text-muted">
          {profileDisplayName(message.sender)}
        </span>
      ) : null}

      <div className="group relative max-w-[85%] sm:max-w-[70%]">
        {isEditing ? (
          <div
            className={cn(
              "space-y-2 rounded-2xl px-4 py-2.5 text-sm shadow-sm",
              isOwn
                ? "rounded-br-md bg-puce-red text-white"
                : "rounded-bl-md border border-border bg-surface text-text"
            )}
          >
            <Textarea
              label="Edit message"
              name={`edit-${message.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="mb-0"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" loading={saving} onClick={() => void handleSave()}>
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
            {editError ? <p className="text-xs text-rust">{editError}</p> : null}
          </div>
        ) : (
          <div className={cn("relative", showReactions && "pb-2.5")}>
            <div
              className={cn(
                "rounded-2xl text-sm leading-relaxed shadow-sm",
                isAttachmentOnly ? "overflow-hidden p-1" : "px-4 py-2.5",
                isOwn
                  ? "rounded-br-md bg-puce-red text-white"
                  : "rounded-bl-md border border-border bg-surface text-text"
              )}
            >
              <div className={cn(!isAttachmentOnly && "space-y-2")}>
                {hasReply ? (
                  <MessageReplyPreview reply={message.reply_to!} isOwn={isOwn} compact />
                ) : null}
                {hasAttachment ? (
                  <CommentAttachment
                    url={message.attachment_url!}
                    className={cn(isAttachmentOnly && "rounded-xl")}
                  />
                ) : null}
                {hasBody ? <p className={hasAttachment ? "px-1" : undefined}>{message.body}</p> : null}
              </div>
            </div>

            {showReactions ? (
              <MessageReactionBar
                reactions={message.reactions!}
                participantNames={participantNames}
                onToggleReaction={(emoji) => onToggleReaction!(message.id, emoji)}
                alignEnd={isOwn}
                className={cn(
                  "absolute bottom-0 z-10 translate-y-1/2",
                  isOwn ? "right-2" : "left-2"
                )}
              />
            ) : null}
          </div>
        )}

        {showActions ? (
          <div
            className={cn(
              "relative z-30 h-8 shrink-0",
              showReactions ? "mt-1" : "mt-0.5"
            )}
          >
            <div
              className={cn(
                "absolute top-0 flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5 shadow-sm",
                "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
                isOwn ? "right-0" : "left-0"
              )}
            >
              {onReply ? (
                <button
                  type="button"
                  className={actionButtonClass}
                  onClick={() => onReply(message)}
                  aria-label="Reply"
                >
                  <span className="hidden sm:inline">Reply</span>
                  <span className="sm:hidden" aria-hidden>
                    ↩
                  </span>
                </button>
              ) : null}
              {onToggleReaction ? (
                <div className="relative">
                  <button
                    type="button"
                    className={cn(actionButtonClass, "text-base leading-none")}
                    onClick={() => setShowReactionPicker((open) => !open)}
                    aria-label="Add reaction"
                    aria-expanded={showReactionPicker}
                  >
                    +
                  </button>
                  {showReactionPicker ? (
                    <MessageReactionPicker
                      alignEnd={isOwn}
                      onSelect={(emoji) => onToggleReaction(message.id, emoji)}
                      onClose={() => setShowReactionPicker(false)}
                    />
                  ) : null}
                </div>
              ) : null}
              {isOwn && onEdit ? (
                <button
                  type="button"
                  className={actionButtonClass}
                  onClick={() => {
                    setDraft(message.body);
                    setEditError(null);
                    setIsEditing(true);
                  }}
                  aria-label="Edit message"
                >
                  <span className="hidden sm:inline">Edit</span>
                  <span className="sm:hidden" aria-hidden>
                    ✎
                  </span>
                </button>
              ) : null}
              {isOwn && onDelete ? (
                <button
                  type="button"
                  className={actionButtonClass}
                  onClick={() => onDelete(message.id)}
                  aria-label="Delete message"
                >
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden" aria-hidden>
                    ✕
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <time
          dateTime={message.created_at}
          className="relative z-0 px-1 text-[11px] text-text-muted"
        >
          {formatMessageTimestamp(message.created_at, locale)}
          {edited ? " · edited" : ""}
        </time>
      </div>
    </div>
  );
}
