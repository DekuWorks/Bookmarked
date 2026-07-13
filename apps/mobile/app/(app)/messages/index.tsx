import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../../src/components/Avatar";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { SegmentedTabs } from "../../../src/components/SegmentedTabs";
import { UnreadBadge } from "../../../src/components/UnreadBadge";
import { useConversations } from "../../../src/hooks/useMessages";
import { getMyClubs } from "../../../src/services/bookClubs";
import { conversationDisplayName, formatMessageTimestamp } from "../../../src/services/messages";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../../src/navigation/TabBarScroll";
import { useAuthStore } from "../../../src/store/authStore";

type Segment = "dms" | "clubs";

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: "dms", label: "Messages" },
  { id: "clubs", label: "Book Clubs" },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { onScroll } = useTabBarScroll();
  const [segment, setSegment] = useState<Segment>("dms");

  const conversations = useConversations();
  const clubs = useQuery({
    queryKey: ["my-clubs", userId],
    queryFn: () => getMyClubs(userId as string),
    enabled: Boolean(userId),
  });

  const loading = segment === "dms" ? conversations.isLoading : clubs.isLoading;

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 8 }} className="bg-background px-4 pb-3">
        <Text className="mb-3 text-3xl font-black text-puce-red">Messages</Text>
        <SegmentedTabs options={SEGMENTS} value={segment} onChange={setSegment} />
      </View>

      {loading ? (
        <LoadingState message="Loading…" />
      ) : segment === "dms" ? (
        <Animated.FlatList
          data={conversations.data ?? []}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          renderItem={({ item }) => {
            const name = conversationDisplayName(item, userId as string);
            const other = item.participants.find((p) => p.user_id !== userId);
            return (
              <Pressable
                onPress={() => router.push(`/messages/${item.id}`)}
                className="mb-2 flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-3 active:opacity-80"
              >
                <Avatar url={other?.profile.avatar_url} name={name} size={48} />
                <View className="flex-1">
                  <Text className="font-semibold text-ink" numberOfLines={1}>
                    {name}
                  </Text>
                  <Text className="text-sm text-ink-muted" numberOfLines={1}>
                    {item.latestMessage?.body ?? "No messages yet"}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  {item.latestMessage ? (
                    <Text className="text-xs text-ink-muted">
                      {formatMessageTimestamp(item.latestMessage.created_at)}
                    </Text>
                  ) : null}
                  {item.unreadCount ? <UnreadBadge count={item.unreadCount} /> : null}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="No conversations yet"
              description="Find a reader in Search to start a chat."
            />
          }
        />
      ) : (
        <Animated.FlatList
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
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Text className="text-lg">💬</Text>
              </View>
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
    </View>
  );
}
