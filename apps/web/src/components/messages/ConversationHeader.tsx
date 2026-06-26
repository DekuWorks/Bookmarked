import Link from "next/link";
import { UserAvatar } from "@/components/messages/UserAvatar";
import { conversationDisplayName } from "@/lib/services/messages";
import { messagesInboxPath } from "@/lib/routes/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import type { ConversationWithParticipants } from "@/types";

type Props = {
  conversation: ConversationWithParticipants;
  currentUserId: string;
};

export function ConversationHeader({ conversation, currentUserId }: Props) {
  const title = conversationDisplayName(conversation, currentUserId);
  const otherParticipant =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.user_id !== currentUserId)
      : null;

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
