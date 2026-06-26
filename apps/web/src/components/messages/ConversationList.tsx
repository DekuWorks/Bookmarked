import { ConversationListItem } from "@/components/messages/ConversationListItem";
import type { ConversationPreview } from "@/types";

type Props = {
  conversations: ConversationPreview[];
  currentUserId: string;
  onPinChange?: () => void;
};

export function ConversationList({ conversations, currentUserId, onPinChange }: Props) {
  const pinned = conversations.filter((c) => c.pinnedAt);
  const recent = conversations.filter((c) => !c.pinnedAt);

  return (
    <div className="space-y-6">
      {pinned.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Pinned ({pinned.length}/3)
          </h2>
          <ul className="space-y-3">
            {pinned.map((conversation) => (
              <li key={conversation.id}>
                <ConversationListItem
                  conversation={conversation}
                  currentUserId={currentUserId}
                  onPinChange={onPinChange}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section>
          {pinned.length > 0 ? (
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              All messages
            </h2>
          ) : null}
          <ul className="space-y-3">
            {recent.map((conversation) => (
              <li key={conversation.id}>
                <ConversationListItem
                  conversation={conversation}
                  currentUserId={currentUserId}
                  onPinChange={onPinChange}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
