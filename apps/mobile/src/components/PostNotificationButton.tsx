import { useEffect, useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import {
  getPostNotificationPreference,
  setPostNotificationPreference,
} from "../services/postNotifications";
import { POST_NOTIFICATION_COPY } from "../../../../packages/utils/postNotifications";

type Props = {
  subscriberId: string;
  creatorId: string;
};

export function PostNotificationButton({ subscriberId, creatorId }: Props) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    void getPostNotificationPreference(subscriberId, creatorId).then(setEnabled);
  }, [subscriberId, creatorId]);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    const result = await setPostNotificationPreference(subscriberId, creatorId, next);
    if (result.error) {
      setEnabled(!next);
      Alert.alert("Couldn't update notifications", result.error);
    }
  }

  return (
    <Pressable
      onPress={() => void toggle()}
      className={`rounded-full px-5 py-2 ${enabled ? "bg-primary/15" : "bg-royal-orange"}`}
    >
      <Text className={`text-sm font-semibold ${enabled ? "text-puce-red" : "text-white"}`}>
        {enabled ? POST_NOTIFICATION_COPY.turnOff : POST_NOTIFICATION_COPY.turnOn}
      </Text>
    </Pressable>
  );
}
