"use client";

import { useEffect, useMemo, useRef } from "react";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { profileDisplayName } from "@/lib/utils/messaging";
import type { ConversationParticipantWithProfile, MessageWithSender } from "@/types";

type Props = {
  messages: MessageWithSender[];
  currentUserId: string;
  isGroup: boolean;
  participants?: ConversationParticipantWithProfile[];
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, body: string) => Promise<{ error?: string }>;
  onReplyToMessage?: (message: MessageWithSender) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
};

export function MessageList({
  messages,
  currentUserId,
  isGroup,
  participants = [],
  onDeleteMessage,
  onEditMessage,
  onReplyToMessage,
  onToggleReaction,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const participantNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const participant of participants) {
      map.set(participant.user_id, profileDisplayName(participant.profile));
    }
    return map;
  }, [participants]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12 text-center">
        <p className="text-sm text-text-muted">No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.sender_id === currentUserId}
          showSenderName={isGroup}
          participantNames={participantNames}
          viewerId={currentUserId}
          onDelete={onDeleteMessage}
          onEdit={onEditMessage}
          onReply={onReplyToMessage}
          onToggleReaction={onToggleReaction}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
