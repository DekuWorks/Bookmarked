"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  getPostNotificationPreference,
  setPostNotificationPreference,
} from "@/lib/services/postNotifications";
import { POST_NOTIFICATION_COPY } from "@bookmarked/utils/postNotifications";

type Props = {
  subscriberId: string;
  creatorId: string;
};

export function PostNotificationButton({ subscriberId, creatorId }: Props) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getPostNotificationPreference(subscriberId, creatorId).then((value) => {
      if (!cancelled) {
        setEnabled(value);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subscriberId, creatorId]);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    const result = await setPostNotificationPreference(subscriberId, creatorId, next);
    if (result.error) {
      setEnabled(!next);
      toast.error(result.error);
    }
  }

  return (
    <Button
      type="button"
      variant={enabled ? "outline" : "secondary"}
      size="sm"
      loading={loading}
      onClick={() => void toggle()}
    >
      {enabled ? POST_NOTIFICATION_COPY.turnOff : POST_NOTIFICATION_COPY.turnOn}
    </Button>
  );
}
