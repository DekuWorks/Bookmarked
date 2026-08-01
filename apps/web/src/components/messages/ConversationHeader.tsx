"use client";

import Link from "next/link";
import { useState } from "react";
import { UserAvatar } from "@/components/messages/UserAvatar";
import { GroupAvatar } from "@/components/messages/GroupAvatar";
import { PinIcon } from "@/components/messages/PinIcon";
import { GroupSettingsMenu } from "@/components/messages/GroupSettingsMenu";
import {
  conversationDisplayName,
  pinConversation,
  unpinConversation,
} from "@/lib/services/messages";
import { messagesInboxPath } from "@/lib/routes/messages";
import { readerProfilePath } from "@/lib/routes/reader";
import { profileDisplayName } from "@/lib/utils/messaging";
import { useToast } from "@/components/ui/Toast";
import type { ConversationWithParticipants } from "@/types";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";

type Props = {
  conversation: ConversationWithParticipants;
  currentUserId: string;
  onPinChange?: (pinnedAt: string | null) => void;
  onConversationUpdate?: () => void;
};

export function ConversationHeader({
  conversation,
  currentUserId,
  onPinChange,
  onConversationUpdate,
}: Props) {
  const toast = useToast();
  const [pinning, setPinning] = useState(false);
  const isPinned = Boolean(conversation.viewerPinnedAt);

  const title = conversationDisplayName(conversation, currentUserId);
  const otherParticipant =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.user_id !== currentUserId)
      : null;
  const peerUsername = otherParticipant?.profile.username?.trim() || null;
  const peerHref = peerUsername ? readerProfilePath(peerUsername) : null;

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
    <header
      className={cn(
        "sticky top-0 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur",
        Z_CLASS.stickyHeader
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Link
          href={messagesInboxPath()}
          className="shrink-0 text-sm font-medium text-primary hover:underline sm:hidden"
        >
          ← Inbox
        </Link>

        {otherParticipant ? (
          peerHref ? (
            <Link
              href={peerHref}
              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
              aria-label={`View ${title}'s profile`}
            >
              <UserAvatar profile={otherParticipant.profile} size="sm" />
            </Link>
          ) : (
            <UserAvatar profile={otherParticipant.profile} size="sm" />
          )
        ) : conversation.type === "group" ? (
          <GroupAvatar title={title} avatarUrl={conversation.avatar_url} size="sm" />
        ) : null}

        <div className="min-w-0 flex-1">
          {peerHref ? (
            <Link
              href={peerHref}
              className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
            >
              <h1 className="truncate text-lg font-semibold text-puce-red hover:underline">
                {title}
              </h1>
              {peerUsername ? (
                <p className="text-xs text-text-muted">@{peerUsername}</p>
              ) : null}
            </Link>
          ) : (
            <>
              <h1 className="truncate text-lg font-semibold text-puce-red">{title}</h1>
              {conversation.type === "group" ? (
                <p className="truncate text-xs text-text-muted">
                  {conversation.participants
                    .map((p) => profileDisplayName(p.profile))
                    .join(", ")}
                </p>
              ) : null}
            </>
          )}
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

        {conversation.type === "group" ? (
          <GroupSettingsMenu
            conversation={conversation}
            currentUserId={currentUserId}
            onUpdated={() => onConversationUpdate?.()}
          />
        ) : null}

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
