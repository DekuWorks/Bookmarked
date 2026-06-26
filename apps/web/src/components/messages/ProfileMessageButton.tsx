"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createDirectConversation } from "@/lib/services/messages";
import { messageThreadPath } from "@/lib/routes/messages";
import { useToast } from "@/components/ui/Toast";

type Props = {
  targetUserId: string;
  className?: string;
};

export function ProfileMessageButton({ targetUserId, className }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await createDirectConversation(targetUserId);
    setLoading(false);

    if (result.error || !result.conversationId) {
      toast.error(result.error ?? "Could not start conversation.");
      return;
    }

    router.push(messageThreadPath(result.conversationId));
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={loading}
      onClick={() => void handleClick()}
      className={className}
    >
      Message
    </Button>
  );
}
