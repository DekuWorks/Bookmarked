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

  try {
    const url = new URL(linkUrl, "https://bookmarked.local");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const params = url.searchParams;

    const username = params.get("username");
    if (path.endsWith("/reader") && username) {
      return `/reader/${encodeURIComponent(username)}`;
    }

    // Web public library: /reader-library/?username=&shelf=
    if (path.includes("/reader-library") && username) {
      const shelf = params.get("shelf");
      if (shelf) {
        return `/reader/${encodeURIComponent(username)}/library/${encodeURIComponent(shelf)}`;
      }
      return `/reader/${encodeURIComponent(username)}/library`;
    }

    // Mobile follow-list deep links: /reader/:username/followers|following|mutuals
    const followListMatch = path.match(
      /\/reader\/([^/]+)\/(followers|following|mutuals)$/
    );
    if (followListMatch) {
      return `/reader/${encodeURIComponent(decodeURIComponent(followListMatch[1]))}/${followListMatch[2]}`;
    }

    // Own library: /library(/:shelf) or /library/custom?slug=
    if (path === "/library" || path.startsWith("/library/")) {
      const customSlug = params.get("slug");
      if (path.endsWith("/custom") && customSlug) {
        return `/library/custom?slug=${encodeURIComponent(customSlug)}`;
      }
      const shelfMatch = path.match(/^\/library\/([^/]+)$/);
      if (shelfMatch && shelfMatch[1] !== "my-books") {
        return `/library/${encodeURIComponent(decodeURIComponent(shelfMatch[1]))}`;
      }
      return "/library";
    }

    if (path === "/reading-room" || path.startsWith("/reading-room/")) {
      return "/reading-room";
    }

    // Mobile library: /reader/:username/library(/:shelf)
    const libraryMatch = path.match(/\/reader\/([^/]+)\/library(?:\/([^/]+))?$/);
    if (libraryMatch) {
      const user = encodeURIComponent(decodeURIComponent(libraryMatch[1]));
      const shelf = libraryMatch[2];
      return shelf
        ? `/reader/${user}/library/${encodeURIComponent(decodeURIComponent(shelf))}`
        : `/reader/${user}/library`;
    }

    const bookId = params.get("id");
    if (path.endsWith("/book") && bookId) {
      return `/book/${bookId}`;
    }

    const clubId = params.get("id");
    if ((path.endsWith("/clubs/club") || path.endsWith("/club")) && clubId) {
      return `/clubs/${clubId}`;
    }

    const threadId = params.get("id");
    if (path.includes("/messages/thread") && threadId) {
      return `/messages/${threadId}`;
    }

    const postId = params.get("post");
    if (path.endsWith("/feed") && postId) {
      return "/feed";
    }
  } catch {
    // Fall through to path-based matching below.
  }

  const readerMatch = linkUrl.match(/[?&]username=([^&#]+)/);
  if (linkUrl.includes("/reader") && readerMatch) {
    return `/reader/${decodeURIComponent(readerMatch[1])}`;
  }

  const bookQuery = linkUrl.match(/\/book\/?\?id=([^&#]+)/);
  if (bookQuery) return `/book/${bookQuery[1]}`;

  const bookMatch = linkUrl.match(/\/book\/([^/?#]+)/);
  if (bookMatch) return `/book/${bookMatch[1]}`;

  const clubMatch = linkUrl.match(/\/clubs\/(?:club\/)?(?:\?id=)?([^/?&#]+)/);
  if (clubMatch && clubMatch[1] !== "club") return `/clubs/${clubMatch[1]}`;

  const clubQuery = linkUrl.match(/\/clubs\/club\/?\?id=([^&#]+)/);
  if (clubQuery) return `/clubs/${clubQuery[1]}`;

  const threadMatch = linkUrl.match(/\/messages\/thread\/?\?id=([^&#]+)/);
  if (threadMatch) return `/messages/${threadMatch[1]}`;

  if (linkUrl.startsWith("/messages")) return "/messages";
  if (linkUrl.includes("/feed")) return "/feed";
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
          renderItem={({ item }) => {
            const actorUsername = item.actor?.username?.trim();
            return (
            <Pressable
              onPress={() => {
                if (!item.read_at) markRead.mutate(item.id);
                const route = mapLinkToRoute(item.link_url);
                if (route) {
                  router.push(route as never);
                  return;
                }
                if (actorUsername) router.push(`/reader/${actorUsername}`);
              }}
              className={`mb-2 flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-80 ${
                item.read_at ? "border-brand-border bg-surface" : "border-primary/40 bg-primary/10"
              }`}
            >
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (actorUsername) router.push(`/reader/${actorUsername}`);
                }}
                disabled={!actorUsername}
                accessibilityRole={actorUsername ? "link" : undefined}
                accessibilityLabel={
                  actorUsername
                    ? `View ${item.actor?.display_name ?? actorUsername}'s profile`
                    : undefined
                }
              >
                <Avatar
                  url={item.actor?.avatar_url}
                  name={item.actor?.display_name ?? item.actor?.username ?? "?"}
                  size={40}
                />
              </Pressable>
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
            );
          }}
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
