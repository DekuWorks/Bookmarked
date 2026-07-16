import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "./Avatar";
import { BookCover } from "./BookCover";
import { timeAgo } from "../utils";
import type { BookClubPostWithAuthor } from "../types";

function authorName(author: BookClubPostWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

type Props = {
  post: BookClubPostWithAuthor;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

export function ClubDiscussionCard({ post, canDelete, deleting, onDelete }: Props) {
  const router = useRouter();
  const username = post.author.username?.trim();

  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4 mb-3">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => username && router.push(`/reader/${username}`)}
          disabled={!username}
          className="flex-row items-center gap-3 flex-1 active:opacity-80"
          accessibilityRole={username ? "link" : undefined}
        >
          <Avatar url={post.author.avatar_url} name={authorName(post.author)} size={36} />
          <View className="flex-1">
            <Text className="font-semibold text-ink" numberOfLines={1}>
              {authorName(post.author)}
            </Text>
            <Text className="text-xs text-ink-muted">{timeAgo(post.created_at)}</Text>
          </View>
        </Pressable>
        {canDelete ? (
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={onDelete}
            className="rounded-full bg-primary/15 px-3 py-1.5 active:opacity-80"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#642F37" />
            ) : (
              <Text className="text-xs font-semibold text-puce-red">Delete</Text>
            )}
          </Pressable>
        ) : null}
      </View>

      <Text className="text-ink mt-3 leading-6">{post.body}</Text>

      {post.book ? (
        <Pressable
          onPress={() => router.push(`/book/${post.book!.id}`)}
          className="flex-row items-center gap-3 mt-3 rounded-xl bg-background p-2 active:opacity-80"
        >
          <BookCover url={post.book.cover_url} title={post.book.title} sizeClassName="w-10 h-14" />
          <View className="flex-1">
            <Text className="text-sm font-medium text-ink" numberOfLines={2}>
              {post.book.title}
            </Text>
            {post.book.author ? (
              <Text className="text-xs text-ink-muted" numberOfLines={1}>
                {post.book.author}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
