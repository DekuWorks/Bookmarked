"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { EmptyInboxState } from "@/components/messages/EmptyInboxState";
import { NewMessageButton } from "@/components/messages/NewMessageButton";
import { NewMessageModal } from "@/components/messages/NewMessageModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getConversations } from "@/lib/services/messages";
import { layout } from "@/lib/constants/layout";
import type { ConversationPreview } from "@/types";

function MessagesInboxContent() {
  const user = useAuthUser();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationPreview[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    setLoadError(null);
    void getConversations(user.id)
      .then(setConversations)
      .catch((error) => {
        console.error("[messages] inbox load failed:", error);
        setLoadError("Could not load messages. Please refresh and try again.");
      });
  }, [user]);

  if (user === undefined || (user && conversations === null && !loadError)) {
    return <LoadingState message="Loading messages…" />;
  }

  if (loadError) {
    return (
      <div className={`${layout.pageStackWide} text-center`}>
        <p className="text-rust">{loadError}</p>
      </div>
    );
  }

  if (!user || !conversations) return null;

  return (
    <div className={layout.pageStackWide}>
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Messages</h1>
          <p className="mt-1 text-text-muted">Direct messages and group chats with other readers.</p>
        </div>
        <NewMessageButton onClick={() => setModalOpen(true)} />
      </header>

      {conversations.length === 0 ? (
        <EmptyInboxState onNewMessage={() => setModalOpen(true)} />
      ) : (
        <ConversationList conversations={conversations} currentUserId={user.id} />
      )}

      <NewMessageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentUserId={user.id}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading messages…" />}>
      <MessagesInboxContent />
    </Suspense>
  );
}
