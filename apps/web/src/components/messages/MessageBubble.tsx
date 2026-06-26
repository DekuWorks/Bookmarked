import { formatMessageTimestamp } from "@/lib/services/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import type { MessageWithSender } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  message: MessageWithSender;
  isOwn: boolean;
  showSenderName: boolean;
  onDelete?: (messageId: string) => void;
};

export function MessageBubble({ message, isOwn, showSenderName, onDelete }: Props) {
  const deleted = Boolean(message.deleted_at);

  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      {showSenderName && !isOwn ? (
        <span className="px-1 text-xs font-medium text-text-muted">
          {profileDisplayName(message.sender)}
        </span>
      ) : null}

      <div className="group relative max-w-[85%] sm:max-w-[70%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
            isOwn
              ? "rounded-br-md bg-puce-red text-white"
              : "rounded-bl-md border border-border bg-surface text-text",
            deleted && "italic opacity-70"
          )}
        >
          {deleted ? "Message deleted" : message.body}
        </div>

        {isOwn && !deleted && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="absolute -bottom-5 right-0 text-[11px] text-text-muted opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
          >
            Delete
          </button>
        ) : null}
      </div>

      <time
        dateTime={message.created_at}
        className="px-1 text-[11px] text-text-muted"
      >
        {formatMessageTimestamp(message.created_at)}
      </time>
    </div>
  );
}
