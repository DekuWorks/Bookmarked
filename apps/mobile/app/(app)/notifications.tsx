import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Avatar } from "../../src/components/Avatar";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { LoadingState } from "../../src/components/LoadingState";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../src/hooks/useNotifications";
import { formatNotificationTimestamp } from "../../src/services/notifications";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../src/navigation/TabBarScroll";

/** Map a web-style link_url to a mobile route where possible. */
function mapLinkToRoute(linkUrl: string | null): string | null {
  if (!linkUrl) return null;
  const bookMatch = linkUrl.match(/\/book\/([^/?#]+)/);
  if (bookMatch) return `/book/${bookMatch[1]}`;
  const clubMatch = linkUrl.match(/\/clubs\/([^/?#]+)/);
  if (clubMatch) return `/clubs/${clubMatch[1]}`;
  if (linkUrl.startsWith("/messages")) return "/messages";
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { onScroll } = useTabBarScroll();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Notifications"
        right={
          (notifications ?? []).some((n) => !n.read_at) ? (
            <Pressable onPress={() => markAll.mutate()} className="px-2 active:opacity-70">
              <Text className="text-sm font-semibold text-primary-dark">Mark all</Text>
            </Pressable>
          ) : null
        }
      />
      {isLoading ? (
        <LoadingState message="Loading notifications…" />
      ) : (
        <Animated.FlatList
          data={notifications ?? []}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (!item.read_at) markRead.mutate(item.id);
                const route = mapLinkToRoute(item.link_url);
                if (route) router.push(route as never);
              }}
              className={`mb-2 flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-80 ${
                item.read_at ? "border-brand-border bg-surface" : "border-primary/40 bg-primary/10"
              }`}
            >
              <Avatar
                url={item.actor?.avatar_url}
                name={item.actor?.display_name ?? item.actor?.username ?? "?"}
                size={40}
              />
              <View className="flex-1">
                {item.title ? (
                  <Text className="font-semibold text-ink" numberOfLines={1}>
                    {item.title}
                  </Text>
                ) : null}
                {item.body ? (
                  <Text className="text-sm text-ink-muted" numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
                <Text className="mt-1 text-xs text-ink-muted">
                  {formatNotificationTimestamp(item.created_at)}
                </Text>
              </View>
              {!item.read_at ? <View className="h-2.5 w-2.5 rounded-full bg-rust" /> : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No notifications"
              description="Likes, comments, follows, and mentions will show up here."
            />
          }
        />
      )}
    </View>
  );
}
