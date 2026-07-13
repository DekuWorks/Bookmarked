import { FlatList, RefreshControl, Text, View } from "react-native";
import { BrandHeader } from "../components/BrandHeader";
import { EmptyState } from "../components/EmptyState";
import { FeedCard } from "../components/FeedCard";
import { LoadingState } from "../components/LoadingState";
import { useFeed } from "../hooks/useFeed";
import { useProfile } from "../hooks/useProfile";

export function HomeScreen() {
  const { data: profile } = useProfile();
  const { data: feed, isLoading, isError, error, refetch, isRefetching } = useFeed();

  const greeting = profile?.display_name?.trim() || profile?.username?.trim();

  return (
    <View className="flex-1 bg-background">
      <BrandHeader
        title={greeting ? `Hi, ${greeting}` : "Your Feed"}
        subtitle="What readers you follow are up to."
      />

      {isLoading ? (
        <LoadingState message="Loading your feed…" />
      ) : isError ? (
        <EmptyState
          title="Couldn't load the feed"
          description={error instanceof Error ? error.message : "Please try again."}
        />
      ) : (
        <FlatList
          data={feed ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 32, flexGrow: 1 }}
          renderItem={({ item }) => <FeedCard item={item} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#642F37" />
          }
          ListEmptyComponent={
            <EmptyState
              title="Your feed is quiet"
              description="Follow other readers on the web app to see their reading activity here."
            />
          }
          ListHeaderComponent={
            feed && feed.length > 0 ? (
              <Text className="text-xs font-semibold uppercase text-ink-muted mb-3">
                Recent activity
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}
