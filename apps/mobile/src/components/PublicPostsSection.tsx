import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { FeedPostCard } from "./FeedPostCard";
import { LoadingState } from "./LoadingState";
import { listPostsByUser } from "../services/posts";
import type { PostEntry } from "../services/socialFeed";

type Props = {
  userId: string;
  viewerId: string;
};

export function PublicPostsSection({ userId, viewerId }: Props) {
  const posts = useQuery({
    queryKey: ["profile-posts", userId, viewerId],
    queryFn: () => listPostsByUser(userId, viewerId, 40),
  });

  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4">
      <Text className="text-lg font-semibold text-puce-red">Posts</Text>
      {posts.isLoading ? (
        <LoadingState message="Loading posts…" />
      ) : !posts.data?.length ? (
        <Text className="mt-3 text-sm text-ink-muted">No posts yet.</Text>
      ) : (
        <View className="mt-3 gap-3">
          {posts.data.map((post) => {
            const entry: PostEntry = {
              kind: "post",
              id: post.id,
              createdAt: post.created_at,
              author: {
                id: post.author.id,
                name:
                  post.author.display_name?.trim() ||
                  post.author.username?.trim() ||
                  "Reader",
                username: post.author.username,
                avatarUrl: post.author.avatar_url,
              },
              post,
            };
            return <FeedPostCard key={post.id} entry={entry} />;
          })}
        </View>
      )}
    </View>
  );
}
