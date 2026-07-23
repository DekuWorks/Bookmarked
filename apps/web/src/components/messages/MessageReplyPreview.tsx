"use client";

import { messageReplySnippet } from "@/lib/services/messages";
import { isGiphyImageUrl } from "@/lib/utils/giphy";
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
  const thumbnailUrl = reply.deleted_at ? null : reply.attachment_url;
  const isGif = thumbnailUrl ? isGiphyImageUrl(thumbnailUrl) : false;

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
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold", isOwn ? "text-white" : "text-text")}>
            {profileDisplayName(reply.sender)}
          </p>
          {snippet ? <p className="truncate">{snippet}</p> : null}
        </div>
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={isGif ? "GIF" : "Photo"}
            className={cn(
              "h-10 w-10 shrink-0 rounded border object-cover",
              isOwn ? "border-white/30" : "border-border",
              isGif && "object-contain bg-background/80"
            )}
          />
        ) : null}
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
