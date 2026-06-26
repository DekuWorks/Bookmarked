import { ConversationListItem } from "@/components/messages/ConversationListItem";
import type { ConversationPreview } from "@/types";

type Props = {
  conversations: ConversationPreview[];
  currentUserId: string;
};

export function ConversationList({ conversations, currentUserId }: Props) {
  return (
    <ul className="space-y-3">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <ConversationListItem
            conversation={conversation}
            currentUserId={currentUserId}
          />
        </li>
      ))}
    </ul>
  );
}
