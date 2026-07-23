"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { MessageReactionBar, MessageReactionPicker } from "@/components/messages/MessageReactionBar";
import { MessageReplyPreview } from "@/components/messages/MessageReplyPreview";
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
  const deleted = Boolean(message.deleted_at);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const edited =
    !deleted &&
    message.updated_at &&
    message.updated_at !== message.created_at;

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

  const canInteract = !deleted && !isEditing;

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
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
              isOwn
                ? "rounded-br-md bg-puce-red text-white"
                : "rounded-bl-md border border-border bg-surface text-text",
              deleted && "italic opacity-70"
            )}
          >
            {deleted ? (
              "Message deleted"
            ) : (
              <div className="space-y-2">
                {message.reply_to ? (
                  <MessageReplyPreview reply={message.reply_to} isOwn={isOwn} compact />
                ) : null}
                {message.attachment_url ? (
                  <a
                    href={message.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={message.attachment_url}
                      alt="Message attachment"
                      className="max-h-64 max-w-full rounded-lg object-cover"
                    />
                  </a>
                ) : null}
                {message.body ? <p>{message.body}</p> : null}
              </div>
            )}
          </div>
        )}

        {canInteract && (onReply || onToggleReaction || onDelete || onEdit) ? (
          <div
            className={cn(
              "absolute -bottom-5 flex gap-2 text-[11px] text-text-muted opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100",
              isOwn ? "right-0" : "left-0"
            )}
          >
            {onReply ? (
              <button type="button" onClick={() => onReply(message)}>
                Reply
              </button>
            ) : null}
            {onToggleReaction ? (
              <div className="relative">
                <button type="button" onClick={() => setShowReactionPicker((open) => !open)}>
                  React
                </button>
                {showReactionPicker ? (
                  <MessageReactionPicker
                    onSelect={(emoji) => onToggleReaction(message.id, emoji)}
                    onClose={() => setShowReactionPicker(false)}
                  />
                ) : null}
              </div>
            ) : null}
            {isOwn && onEdit ? (
              <button
                type="button"
                onClick={() => {
                  setDraft(message.body);
                  setEditError(null);
                  setIsEditing(true);
                }}
              >
                Edit
              </button>
            ) : null}
            {isOwn && onDelete ? (
              <button type="button" onClick={() => onDelete(message.id)}>
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {canInteract && onToggleReaction && message.reactions?.length ? (
        <MessageReactionBar
          reactions={message.reactions}
          participantNames={participantNames}
          onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
          alignEnd={isOwn}
        />
      ) : null}

      <time dateTime={message.created_at} className="px-1 text-[11px] text-text-muted">
        {formatMessageTimestamp(message.created_at, locale)}
        {edited ? " · edited" : ""}
      </time>
    </div>
  );
}
