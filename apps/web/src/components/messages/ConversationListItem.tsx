"use client";

import Link from "next/link";
import { useState } from "react";
import { UserAvatar } from "@/components/messages/UserAvatar";
import { GroupAvatar } from "@/components/messages/GroupAvatar";
import { PinIcon } from "@/components/messages/PinIcon";
import {
  conversationDisplayName,
  formatMessageTimestamp,
  pinConversation,
  unpinConversation,
} from "@/lib/services/messages";
import { messageThreadPath } from "@/lib/routes/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import { useToast } from "@/components/ui/Toast";
import type { ConversationPreview } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  conversation: ConversationPreview;
  currentUserId: string;
  onPinChange?: () => void;
};

export function ConversationListItem({
  conversation,
  currentUserId,
  onPinChange,
}: Props) {
  const toast = useToast();
  const [pinning, setPinning] = useState(false);
  const isPinned = Boolean(conversation.pinnedAt);

  const title = conversationDisplayName(conversation, currentUserId);
  const latest = conversation.latestMessage;
  const preview = latest?.body ?? "No messages yet";
  const timestamp = latest ? formatMessageTimestamp(latest.created_at) : null;

  const avatarProfile =
    conversation.type === "direct"
      ? (conversation.participants.find((p) => p.user_id !== currentUserId)?.profile ??
        conversation.participants[0]?.profile)
      : null;

  async function handlePinToggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    setPinning(true);
    const result = isPinned
      ? await unpinConversation(conversation.id)
      : await pinConversation(conversation.id);
    setPinning(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    onPinChange?.();
  }

  return (
    <div
      className={cn(
        "flex items-stretch gap-1 rounded-xl border border-border bg-surface transition hover:border-primary/30 hover:shadow-sm",
        isPinned && "border-royal-orange/50 bg-royal-orange/5",
        conversation.unreadCount > 0 && !isPinned && "border-primary/40 bg-primary/5"
      )}
    >
      <Link
        href={messageThreadPath(conversation.id)}
        className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 px-4 py-3"
      >
        {conversation.type === "group" ? (
          <GroupAvatar
            title={title}
            avatarUrl={conversation.avatar_url}
          />
        ) : avatarProfile ? (
          <UserAvatar profile={avatarProfile} />
        ) : (
          <div className="h-11 w-11 shrink-0 rounded-full bg-border" />
        )}

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "truncate font-semibold text-text",
                conversation.unreadCount > 0 && "text-puce-red"
              )}
            >
              {title}
            </p>
            {timestamp ? (
              <span className="shrink-0 text-xs text-text-muted">{timestamp}</span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-text-muted">{preview}</p>
          {conversation.type === "group" ? (
            <p className="mt-1 truncate text-xs text-text-muted">
              {conversation.participants
                .map((p) => profileDisplayName(p.profile))
                .join(", ")}
            </p>
          ) : null}
        </div>

        {conversation.unreadCount > 0 ? (
          <span
            className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-puce-red px-1.5 text-[11px] font-semibold text-white"
            aria-label={`${conversation.unreadCount} unread`}
          >
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </span>
        ) : null}
      </Link>

      <button
        type="button"
        onClick={(event) => void handlePinToggle(event)}
        disabled={pinning}
        aria-pressed={isPinned}
        aria-label={isPinned ? "Unpin conversation" : "Pin conversation"}
        title={isPinned ? "Unpin" : "Pin to top"}
        className={cn(
          "flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-r-xl px-3 text-sm transition",
          "text-text-muted hover:bg-background hover:text-royal-orange",
          isPinned && "text-royal-orange"
        )}
      >
        <PinIcon filled={isPinned} />
        {isPinned ? "Unpin" : "Pin"}
      </button>
    </div>
  );
}
