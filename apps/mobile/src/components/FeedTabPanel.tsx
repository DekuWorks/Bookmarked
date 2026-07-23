import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Avatar } from "./Avatar";
import { EmptyState } from "./EmptyState";
import { FeedPostCard } from "./FeedPostCard";
import { LoadingState } from "./LoadingState";
import { TrendingBooksSection } from "./TrendingBooksSection";
import { useHomeFeed, type FeedTab } from "../hooks/useFeed";
import { useProfile } from "../hooks/useProfile";
import { TAB_BAR_SPACE } from "../navigation/TabBarScroll";
import { SANS_FONT } from "../constants/theme";
import { useThemeColors } from "../store/themeStore";
import type { ScrollHandlerProcessed } from "react-native-reanimated";

type Props = {
  tab: FeedTab;
  width: number;
  onScroll: ScrollHandlerProcessed<Record<string, unknown>>;
};

function Composer() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: profile } = useProfile();

  return (
    <View className="mb-4 flex-row items-center gap-3 rounded-full border border-brand-border bg-surface px-3 py-2 shadow-sm">
      <Avatar url={profile?.avatar_url} name={profile?.display_name ?? profile?.username} size={36} />
      <Pressable
        onPress={() => router.push("/compose")}
        className="flex-1 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="What are you reading?"
      >
        <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>What are you reading?</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/compose")}
        accessibilityLabel="Add a photo"
        className="h-9 w-9 items-center justify-center rounded-full bg-primary/15 active:opacity-70"
      >
        <Text className="text-base text-puce-red">🖼️</Text>
      </Pressable>
    </View>
  );
}

export function FeedTabPanel({ tab, width, onScroll }: Props) {
  const colors = useThemeColors();
  const { data: feed, isLoading, isError, error, refetch, isRefetching } = useHomeFeed(tab);

  return (
    <Animated.FlatList
      style={{ width }}
      data={feed ?? []}
      keyExtractor={(item) => `${item.kind}:${item.id}`}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
      renderItem={({ item }) => <FeedPostCard entry={item} />}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.puceRed} />
      }
      ListHeaderComponent={
        tab === "clubs" ? null : (
          <View>
            {tab === "for-you" ? <TrendingBooksSection /> : null}
            <Composer />
          </View>
        )
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
