"use client";

import Link from "next/link";
import { useState } from "react";
import { UserAvatar } from "@/components/messages/UserAvatar";
import { PinIcon } from "@/components/messages/PinIcon";
import {
  conversationDisplayName,
  pinConversation,
  unpinConversation,
} from "@/lib/services/messages";
import { messagesInboxPath } from "@/lib/routes/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import { useToast } from "@/components/ui/Toast";
import type { ConversationWithParticipants } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  conversation: ConversationWithParticipants;
  currentUserId: string;
  onPinChange?: (pinnedAt: string | null) => void;
};

export function ConversationHeader({
  conversation,
  currentUserId,
  onPinChange,
}: Props) {
  const toast = useToast();
  const [pinning, setPinning] = useState(false);
  const isPinned = Boolean(conversation.viewerPinnedAt);

  const title = conversationDisplayName(conversation, currentUserId);
  const otherParticipant =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.user_id !== currentUserId)
      : null;

  async function handlePinToggle() {
    setPinning(true);
    const result = isPinned
      ? await unpinConversation(conversation.id)
      : await pinConversation(conversation.id);
    setPinning(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    onPinChange?.(isPinned ? null : new Date().toISOString());
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Link
          href={messagesInboxPath()}
          className="shrink-0 text-sm font-medium text-primary hover:underline sm:hidden"
        >
          ← Inbox
        </Link>

        {otherParticipant ? <UserAvatar profile={otherParticipant.profile} size="sm" /> : null}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-puce-red">{title}</h1>
          {conversation.type === "group" ? (
            <p className="truncate text-xs text-text-muted">
              {conversation.participants
                .map((p) => profileDisplayName(p.profile))
                .join(", ")}
            </p>
          ) : otherParticipant?.profile.username ? (
            <p className="text-xs text-text-muted">@{otherParticipant.profile.username}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handlePinToggle()}
          disabled={pinning}
          aria-pressed={isPinned}
          aria-label={isPinned ? "Unpin conversation" : "Pin conversation"}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition",
            "text-text-muted hover:bg-background hover:text-royal-orange",
            isPinned && "text-royal-orange"
          )}
        >
          <PinIcon filled={isPinned} className="h-3.5 w-3.5" />
          {isPinned ? "Unpin" : "Pin"}
        </button>

        <Link
          href={messagesInboxPath()}
          className="hidden shrink-0 text-sm font-medium text-primary hover:underline sm:inline"
        >
          All messages
        </Link>
      </div>
    </header>
  );
}
