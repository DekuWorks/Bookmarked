import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Avatar } from "../components/Avatar";
import { BrandTopHeader } from "../components/BrandTopHeader";
import { EmptyState } from "../components/EmptyState";
import { FeedPostCard } from "../components/FeedPostCard";
import { LoadingState } from "../components/LoadingState";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { useHomeFeed, type FeedTab } from "../hooks/useFeed";
import { useProfile } from "../hooks/useProfile";
import { TAB_BAR_SPACE, useTabBarScroll } from "../navigation/TabBarScroll";

const TAB_OPTIONS: { id: FeedTab; label: string }[] = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
  { id: "clubs", label: "Book Clubs" },
];

function Composer() {
  const router = useRouter();
  const { data: profile } = useProfile();
  return (
    <View className="mb-4 flex-row items-center gap-3 rounded-full border border-brand-border bg-surface px-3 py-2">
      <Avatar url={profile?.avatar_url} name={profile?.display_name ?? profile?.username} size={36} />
      <Pressable
        onPress={() => router.push("/compose")}
        className="flex-1 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="What are you reading?"
      >
        <Text className="text-ink-muted">What are you reading?</Text>
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

export function FeedScreen() {
  const [tab, setTab] = useState<FeedTab>("for-you");
  const { data: feed, isLoading, isError, error, refetch, isRefetching } = useHomeFeed(tab);
  const { onScroll } = useTabBarScroll();

  return (
    <View className="flex-1 bg-background">
      <BrandTopHeader>
        <SegmentedTabs
          className="mt-3 justify-center"
          options={TAB_OPTIONS}
          value={tab}
          onChange={setTab}
        />
      </BrandTopHeader>

      <Animated.FlatList
        data={feed ?? []}
        keyExtractor={(item) => `${item.kind}:${item.id}`}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
        renderItem={({ item }) => <FeedPostCard entry={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#642F37" />
        }
        ListHeaderComponent={tab === "clubs" ? null : <Composer />}
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
    </View>
  );
}
