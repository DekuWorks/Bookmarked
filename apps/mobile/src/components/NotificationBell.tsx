import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useUnreadNotificationCount } from "../hooks/useNotifications";

/**
 * Header notification bell with an unread dot, matching the mockup
 * (bell top-right with a small dot when there are unread notifications).
 */
export function NotificationBell() {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
      onPress={() => router.push("/notifications")}
      className="relative h-11 w-11 items-center justify-center rounded-full active:bg-white/40"
    >
      <Text className="text-xl text-puce-red">🔔</Text>
      {hasUnread ? (
        <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-white bg-rust" />
      ) : null}
    </Pressable>
  );
}
