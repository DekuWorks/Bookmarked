import Link from "next/link";
import { UserAvatar } from "@/components/messages/UserAvatar";
import {
  conversationDisplayName,
  formatMessageTimestamp,
} from "@/lib/services/messages";
import { messageThreadPath } from "@/lib/routes/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import type { ConversationPreview } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  conversation: ConversationPreview;
  currentUserId: string;
};

export function ConversationListItem({ conversation, currentUserId }: Props) {
  const title = conversationDisplayName(conversation, currentUserId);
  const latest = conversation.latestMessage;
  const preview = latest?.deleted_at
    ? "Message deleted"
    : latest?.body ?? "No messages yet";
  const timestamp = latest ? formatMessageTimestamp(latest.created_at) : null;

  const avatarProfile =
    conversation.type === "direct"
      ? (conversation.participants.find((p) => p.user_id !== currentUserId)?.profile ??
        conversation.participants[0]?.profile)
      : null;

  return (
    <Link
      href={messageThreadPath(conversation.id)}
      className={cn(
        "flex min-h-[72px] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition hover:border-primary/30 hover:shadow-sm",
        conversation.unreadCount > 0 && "border-primary/40 bg-primary/5"
      )}
    >
      {conversation.type === "group" ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal-orange/20 text-sm font-bold text-puce-red">
          {title.slice(0, 2).toUpperCase()}
        </div>
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
  );
}
