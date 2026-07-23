"use client";

import { useState } from "react";
import { MESSAGE_QUICK_REACTIONS } from "@/lib/constants/messageReactions";
import type { MessageReactionSummary } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  reactions: MessageReactionSummary[];
  participantNames: Map<string, string>;
  onToggleReaction: (emoji: string) => void;
  alignEnd?: boolean;
};

export function MessageReactionBar({
  reactions,
  participantNames,
  onToggleReaction,
  alignEnd,
}: Props) {
  const [openEmoji, setOpenEmoji] = useState<string | null>(null);

  if (!reactions.length) return null;

  return (
    <div className={cn("mt-1 flex flex-wrap gap-1", alignEnd ? "justify-end" : "justify-start")}>
      {reactions.map((reaction) => {
        const names = reaction.user_ids
          .map((userId) => participantNames.get(userId))
          .filter(Boolean) as string[];

        return (
          <div key={reaction.emoji} className="relative">
            <button
              type="button"
              onClick={() => onToggleReaction(reaction.emoji)}
              onMouseEnter={() => setOpenEmoji(reaction.emoji)}
              onMouseLeave={() => setOpenEmoji(null)}
              onFocus={() => setOpenEmoji(reaction.emoji)}
              onBlur={() => setOpenEmoji(null)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs shadow-sm transition",
                reaction.viewer_reacted
                  ? "border-puce-red/40 bg-puce-red/10 text-text"
                  : "border-border bg-surface text-text-muted hover:bg-background"
              )}
              aria-label={`${reaction.emoji} reaction, ${reaction.count}`}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </button>
            {openEmoji === reaction.emoji && names.length ? (
              <div className="absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-48 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-[11px] text-white shadow-lg">
                {names.join(", ")}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type PickerProps = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export function MessageReactionPicker({ onSelect, onClose }: PickerProps) {
  return (
    <div className="absolute bottom-full right-0 z-20 mb-2 flex gap-1 rounded-full border border-border bg-surface px-2 py-1 shadow-lg">
      {MESSAGE_QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="rounded-full px-1.5 py-0.5 text-lg hover:bg-background"
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
