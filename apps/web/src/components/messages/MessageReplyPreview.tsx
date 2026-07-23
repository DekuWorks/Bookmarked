"use client";

import { messageReplySnippet } from "@/lib/services/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import type { MessageReplyPreview as MessageReplyPreviewType } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  reply: MessageReplyPreviewType;
  isOwn: boolean;
  compact?: boolean;
  onClear?: () => void;
};

export function MessageReplyPreview({ reply, isOwn, compact, onClear }: Props) {
  const snippet = messageReplySnippet(reply);

  return (
    <div
      className={cn(
        "rounded-lg border-l-2 px-2.5 py-1.5 text-xs",
        isOwn
          ? "border-white/70 bg-white/10 text-white/90"
          : "border-puce-red/60 bg-background/70 text-text-muted",
        compact && "mb-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("font-semibold", isOwn ? "text-white" : "text-text")}>
            {profileDisplayName(reply.sender)}
          </p>
          <p className="truncate">{snippet}</p>
        </div>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "shrink-0 rounded px-1 text-[11px]",
              isOwn ? "text-white/80 hover:text-white" : "text-text-muted hover:text-text"
            )}
            aria-label="Cancel reply"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
