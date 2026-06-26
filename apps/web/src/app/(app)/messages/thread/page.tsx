"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ConversationHeader } from "@/components/messages/ConversationHeader";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { MessageList } from "@/components/messages/MessageList";
import { LoadingState } from "@/components/ui/LoadingState";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import {
  deleteMessage,
  getConversation,
  getMessages,
  markConversationRead,
  sendMessage,
} from "@/lib/services/messages";
import { messagesInboxPath } from "@/lib/routes/messages";
import type { ConversationWithParticipants, MessageWithSender } from "@/types";

function MessageThreadContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id")?.trim() ?? "";
  const user = useAuthUser();
  const [conversation, setConversation] = useState<ConversationWithParticipants | null>(
    null
  );
  const [messages, setMessages] = useState<MessageWithSender[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    if (!user || !conversationId) return;

    const [conv, msgs] = await Promise.all([
      getConversation(conversationId, user.id),
      getMessages(conversationId),
    ]);

    if (!conv) {
      setLoadError("Conversation not found or you do not have access.");
      setConversation(null);
      setMessages([]);
      return;
    }

    setConversation(conv);
    setMessages(msgs);
    await markConversationRead(conversationId);
  }, [conversationId, user]);

  useEffect(() => {
    if (!user || !conversationId) return;

    setLoadError(null);
    setConversation(null);
    setMessages(null);

    void loadThread().catch((error) => {
      console.error("[messages] thread load failed:", error);
      setLoadError("Could not load conversation. Please refresh and try again.");
    });
  }, [user, conversationId, loadThread]);

  useEffect(() => {
    if (!user || !conversationId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void loadThread();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void loadThread();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, conversationId, loadThread]);

  async function handleSend(body: string) {
    if (!conversationId) return { error: "Missing conversation." };

    const result = await sendMessage(conversationId, body);
    if (result.error) return { error: result.error };

    await loadThread();
    return {};
  }

  async function handleDeleteMessage(messageId: string) {
    const result = await deleteMessage(messageId);
    if (result.error) return;
    await loadThread();
  }

  if (!conversationId) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No conversation selected.</p>
        <ButtonLink href={messagesInboxPath()} variant="primary">
          Back to inbox
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || (user && messages === null && !loadError)) {
    return <LoadingState message="Loading conversation…" />;
  }

  if (loadError) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-rust">{loadError}</p>
        <Link href={messagesInboxPath()} className="text-sm text-primary hover:underline">
          ← Back to inbox
        </Link>
      </div>
    );
  }

  if (!user || !conversation || messages === null) return null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col rounded-xl border border-border bg-background shadow-sm">
      <ConversationHeader conversation={conversation} currentUserId={user.id} />

      <MessageList
        messages={messages}
        currentUserId={user.id}
        isGroup={conversation.type === "group"}
        onDeleteMessage={(messageId) => void handleDeleteMessage(messageId)}
      />

      <MessageComposer onSend={handleSend} />
    </div>
  );
}

export default function MessageThreadPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading conversation…" />}>
      <MessageThreadContent />
    </Suspense>
  );
}
