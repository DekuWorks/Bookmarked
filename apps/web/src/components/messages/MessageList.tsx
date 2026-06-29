"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/messages/MessageBubble";
import type { MessageWithSender } from "@/types";

type Props = {
  messages: MessageWithSender[];
  currentUserId: string;
  isGroup: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, body: string) => Promise<{ error?: string }>;
};

export function MessageList({
  messages,
  currentUserId,
  isGroup,
  onDeleteMessage,
  onEditMessage,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

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
          onDelete={onDeleteMessage}
          onEdit={onEditMessage}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
