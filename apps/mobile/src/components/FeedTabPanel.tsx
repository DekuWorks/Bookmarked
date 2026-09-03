import { useEffect, useMemo, useRef } from "react";
import { Pressable, RefreshControl, Text, View, type FlatList } from "react-native";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Avatar } from "./Avatar";
import { EmptyState } from "./EmptyState";
import { FeedDiscoveryCard } from "./FeedDiscoveryCard";
import { FeedPostCard } from "./FeedPostCard";
import { LoadingState } from "./LoadingState";
import { useHomeFeed, type FeedTab } from "../hooks/useFeed";
import { useProfile } from "../hooks/useProfile";
import { TAB_BAR_SPACE } from "../navigation/TabBarScroll";
import { SANS_FONT } from "../constants/theme";
import { useThemeColors } from "../store/themeStore";
import { interleaveFeedWithDiscovery } from "../../../../packages/utils";
import type { ScrollHandlerProcessed } from "react-native-reanimated";
import type { FeedEntry } from "../services/socialFeed";
import type { FeedDiscoverySectionId } from "../../../../packages/utils";
import { feedComposeHref } from "../lib/feedNav";

type FeedListRow =
  | { kind: "item"; item: FeedEntry; key: string }
  | { kind: "discovery"; id: FeedDiscoverySectionId; key: string };

type Props = {
  tab: FeedTab;
  width: number;
  onScroll: ScrollHandlerProcessed<Record<string, unknown>>;
  highlightedPostId?: string;
  restoreScroll?: number;
};

function Composer({ getScrollOffset }: { getScrollOffset: () => number }) {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: profile } = useProfile();
  function openCompose() {
    router.push(feedComposeHref(getScrollOffset()) as never);
  }

  return (
    <View className="mb-4 flex-row items-center gap-3 rounded-full border border-brand-border bg-surface px-3 py-2 shadow-sm">
      <Avatar url={profile?.avatar_url} name={profile?.display_name ?? profile?.username} size={36} />
      <Pressable
        onPress={openCompose}
        className="flex-1 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Write a post."
      >
        <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>Write a post.</Text>
      </Pressable>
      <Pressable
        onPress={openCompose}
        accessibilityLabel="Add a photo"
        className="h-9 w-9 items-center justify-center rounded-full bg-primary/15 active:opacity-70"
      >
        <Text className="text-base text-puce-red">🖼️</Text>
      </Pressable>
    </View>
  );
}

export function FeedTabPanel({ tab, width, onScroll, highlightedPostId, restoreScroll }: Props) {
  const colors = useThemeColors();
  const listRef = useRef<FlatList<FeedListRow>>(null);
  const scrollOffsetRef = useRef(0);
  const { data: feed, isLoading, isError, error, refetch, isRefetching } = useHomeFeed(tab);

  const rows = useMemo<FeedListRow[]>(() => {
    const items = feed ?? [];
    if (tab === "clubs") {
      return items.map((item) => ({
        kind: "item" as const,
        item,
        key: `${item.kind}:${item.id}`,
      }));
    }
    return interleaveFeedWithDiscovery(items).map((row, index) =>
      row.kind === "discovery"
        ? { kind: "discovery" as const, id: row.id, key: `discovery:${row.id}:${index}` }
        : { kind: "item" as const, item: row.item, key: `${row.item.kind}:${row.item.id}` }
    );
  }, [feed, tab]);

  useEffect(() => {
    if (restoreScroll == null || restoreScroll <= 0 || !rows.length) return;
    const handle = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: restoreScroll, animated: false });
    }, 200);
    return () => clearTimeout(handle);
  }, [restoreScroll, rows]);

  useEffect(() => {
    if (!highlightedPostId || !rows.length) return;
    const index = rows.findIndex(
      (row) => row.kind === "item" && row.item.kind === "post" && row.item.id === highlightedPostId
    );
    if (index < 0) return;
    const handle = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
    }, 350);
    return () => clearTimeout(handle);
  }, [highlightedPostId, rows]);

  return (
    <Animated.FlatList
      ref={listRef}
      style={{ width }}
      data={rows}
      keyExtractor={(item) => item.key}
      onScroll={onScroll}
      onMomentumScrollEnd={(event) => {
        scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      }}
      onScrollEndDrag={(event) => {
        scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      onScrollToIndexFailed={() => {
        /* deep-linked post may not be in the first page */
      }}
      contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
      renderItem={({ item }) =>
        item.kind === "discovery" ? (
          <FeedDiscoveryCard sectionId={item.id} getScrollOffset={() => scrollOffsetRef.current} />
        ) : (
          <FeedPostCard entry={item.item} getScrollOffset={() => scrollOffsetRef.current} />
        )
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.puceRed} />
      }
      ListHeaderComponent={
        tab === "clubs" ? null : <Composer getScrollOffset={() => scrollOffsetRef.current} />
      }
      ListEmptyComponent={
        isLoading ? (
          <LoadingState message="Loading your feed…" />
        ) : isError ? (
          <EmptyState
            title="Couldn't load the feed"
            description={error instanceof Error ? error.message : "Please try again."}
          />
        ) : tab === "following" ? (
          <EmptyState
            title="Your following feed is quiet"
            description="Follow readers to see their reviews, posts, and discussions here."
          />
        ) : tab === "clubs" ? (
          <EmptyState
            title="No club discussions yet"
            description="Join a book club and start the conversation."
          />
        ) : (
          <EmptyState
            title="Nothing here yet"
            description="Reviews, posts, and discussions from the community will appear here."
          />
        )
      }
    />
  );
}
