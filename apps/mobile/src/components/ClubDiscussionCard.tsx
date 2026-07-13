import { Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { BookCover } from "./BookCover";
import { timeAgo } from "../utils";
import type { BookClubPostWithAuthor } from "../types";

function authorName(author: BookClubPostWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

export function ClubDiscussionCard({ post }: { post: BookClubPostWithAuthor }) {
  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4 mb-3">
      <View className="flex-row items-center gap-3">
        <Avatar url={post.author.avatar_url} name={authorName(post.author)} size={36} />
        <View className="flex-1">
          <Text className="font-semibold text-ink" numberOfLines={1}>
            {authorName(post.author)}
          </Text>
          <Text className="text-xs text-ink-muted">{timeAgo(post.created_at)}</Text>
        </View>
      </View>

      <Text className="text-ink mt-3 leading-6">{post.body}</Text>

      {post.book ? (
        <View className="flex-row items-center gap-3 mt-3 rounded-xl bg-background p-2">
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
        </View>
      ) : null}
    </View>
  );
}
