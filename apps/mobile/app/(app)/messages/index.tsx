import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../../src/components/Avatar";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { NewMessageSheet } from "../../../src/components/messages/NewMessageSheet";
import { ScreenGradientWash } from "../../../src/components/ScreenGradientWash";
import { SegmentedTabs } from "../../../src/components/SegmentedTabs";
import { UnreadBadge } from "../../../src/components/UnreadBadge";
import { useConversations, usePinConversation } from "../../../src/hooks/useMessages";
import { getMyClubs } from "../../../src/services/bookClubs";
import { conversationDisplayName, formatMessageTimestamp } from "../../../src/services/messages";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../../src/navigation/TabBarScroll";
import { useAuthStore } from "../../../src/store/authStore";
import type { ConversationPreview } from "../../../src/types";

type Segment = "dms" | "clubs";

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: "dms", label: "Messages" },
  { id: "clubs", label: "Book Clubs" },
];

/** Conservative estimate until the header is measured (title + segmented tabs). */
const MESSAGES_WASH_HEIGHT_RATIO = 0.16;

function conversationPreview(item: ConversationPreview): string {
  const latest = item.latestMessage;
  if (!latest) return "No messages yet";
  if (latest.body?.trim()) return latest.body;
  if (latest.attachment_url) return "Photo";
  return "No messages yet";
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { onScroll } = useTabBarScroll();
  const [segment, setSegment] = useState<Segment>("dms");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const onHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setHeaderHeight((prev) => (prev === next ? prev : next));
  }, []);

  const conversations = useConversations();
  const pinConversation = usePinConversation();
  const clubs = useQuery({
    queryKey: ["my-clubs", userId],
    queryFn: () => getMyClubs(userId as string),
    enabled: Boolean(userId),
  });

  const loading = segment === "dms" ? conversations.isLoading : clubs.isLoading;

  function handlePinToggle(item: ConversationPreview) {
    const isPinned = Boolean(item.pinnedAt);
    void pinConversation.mutateAsync(
      { conversationId: item.id, pinned: isPinned },
      {
        onError: () => {},
        onSuccess: (result) => {
          if (result.error) Alert.alert("Couldn't update pin", result.error);
        },
      }
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenGradientWash
        height={headerHeight > 0 ? headerHeight : undefined}
        heightRatio={MESSAGES_WASH_HEIGHT_RATIO}
      />
      <View onLayout={onHeaderLayout} style={{ paddingTop: insets.top + 8 }} className="px-4 pb-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-3xl font-black text-puce-red">Messages</Text>
          {segment === "dms" ? (
            <Pressable
              onPress={() => setNewMessageOpen(true)}
              accessibilityLabel="New message"
              className="h-10 w-10 items-center justify-center rounded-full bg-on-primary active:opacity-80"
            >
              <Text className="text-xl font-bold text-white">+</Text>
            </Pressable>
          ) : null}
        </View>
        <SegmentedTabs options={SEGMENTS} value={segment} onChange={setSegment} />
      </View>

      {loading ? (
        <LoadingState message="Loading…" />
      ) : segment === "dms" ? (
        <Animated.FlatList
          className="flex-1 bg-background"
          data={conversations.data ?? []}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          renderItem={({ item }) => {
            const name = conversationDisplayName(item, userId as string);
            const other = item.participants.find((p) => p.user_id !== userId);
            const isGroup = item.type === "group";
            const isPinned = Boolean(item.pinnedAt);
            return (
              <View
                className={`mb-2 flex-row items-stretch overflow-hidden rounded-2xl border ${
                  isPinned
                    ? "border-royal-orange/50 bg-royal-orange/5"
                    : item.unreadCount
                      ? "border-primary/40 bg-primary/5"
                      : "border-brand-border bg-surface"
                }`}
              >
                <Pressable
                  onPress={() => router.push(`/messages/${item.id}`)}
                  onLongPress={() => handlePinToggle(item)}
                  className="min-h-[72px] flex-1 flex-row items-center gap-3 p-3 active:opacity-80"
                >
                  {isGroup ? (
                    <Avatar url={item.avatar_url} name={name} size={48} />
                  ) : (
                    <Avatar url={other?.profile.avatar_url} name={name} size={48} />
                  )}
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text
                        className={`flex-1 font-semibold ${item.unreadCount ? "text-puce-red" : "text-ink"}`}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      {item.latestMessage ? (
                        <Text className="shrink-0 text-xs text-ink-muted">
                          {formatMessageTimestamp(item.latestMessage.created_at)}
                        </Text>
                      ) : null}
                    </View>
                    <Text className="text-sm text-ink-muted" numberOfLines={1}>
                      {conversationPreview(item)}
                    </Text>
                    {isGroup ? (
                      <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
                        {item.participants
                          .map(
                            (p) =>
                              p.profile.display_name?.trim() ||
                              p.profile.username?.trim() ||
                              "Reader"
                          )
                          .join(", ")}
                      </Text>
                    ) : null}
                  </View>
                  {item.unreadCount ? <UnreadBadge count={item.unreadCount} /> : null}
                </Pressable>
                <Pressable
                  onPress={() => handlePinToggle(item)}
                  accessibilityLabel={isPinned ? "Unpin conversation" : "Pin conversation"}
                  accessibilityHint={isPinned ? "Pinned" : "Pin to top of list"}
                  className="items-center justify-center px-3 active:opacity-70"
                >
                  <Text className={`text-lg ${isPinned ? "text-royal-orange" : "text-ink-muted"}`}>
                    📌
                  </Text>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="No conversations yet"
              description="Tap + to start a direct or group chat."
            />
          }
        />
      ) : (
        <Animated.FlatList
          className="flex-1 bg-background"
          data={clubs.data ?? []}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/clubs/${item.id}`)}
              className="mb-2 flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-3 active:opacity-80"
            >
              <Avatar url={item.image_url} name={item.name} size={48} />
              <View className="flex-1">
                <Text className="font-semibold text-ink" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-sm text-ink-muted" numberOfLines={1}>
                  {item.current_book ? `Reading ${item.current_book.title}` : "Open discussions"}
                </Text>
              </View>
              <Text className="text-xs text-primary-dark">{item.member_count} 👥</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No book clubs yet"
              description="Join a club from Search or the Feed to see its discussions here."
            />
          }
        />
      )}

      {userId ? (
        <NewMessageSheet
          visible={newMessageOpen}
          currentUserId={userId}
          onClose={() => setNewMessageOpen(false)}
        />
      ) : null}
    </View>
  );
}
