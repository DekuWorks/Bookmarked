import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { BookCover } from "./BookCover";
import { timeAgo } from "../utils";
import type { FeedItem } from "../services/feed";

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const canOpen = Boolean(item.bookId);

  return (
    <Pressable
      disabled={!canOpen}
      onPress={() => item.bookId && router.push(`/book/${item.bookId}`)}
      className="mb-3 flex-row gap-3 rounded-2xl border border-brand-border bg-surface p-4 active:opacity-80"
    >
      <Avatar url={item.avatarUrl} name={item.authorName} size={40} />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-ink" numberOfLines={1}>
            {item.authorName}
          </Text>
          <Text className="ml-2 text-xs text-ink-muted">{timeAgo(item.created_at)}</Text>
        </View>
        <View className="mt-1 flex-row items-center">
          <Text className="flex-1 leading-5 text-ink-muted">{item.message}</Text>
          {item.ratingEmoji ? (
            <Text className="ml-1 text-base" accessibilityLabel="rating emoji">
              {item.ratingEmoji}
            </Text>
          ) : null}
        </View>
      </View>
      {item.coverUrl || item.bookTitle ? (
        <BookCover url={item.coverUrl} title={item.bookTitle} sizeClassName="w-12 h-16" />
      ) : null}
    </Pressable>
  );
}
