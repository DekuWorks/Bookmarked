import { Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { BookCover } from "./BookCover";
import { timeAgo } from "../utils";
import type { FeedItem } from "../services/feed";

export function FeedCard({ item }: { item: FeedItem }) {
  return (
    <View className="flex-row gap-3 rounded-2xl border border-brand-border bg-surface p-4 mb-3">
      <Avatar url={item.avatarUrl} name={item.authorName} size={40} />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-ink" numberOfLines={1}>
            {item.authorName}
          </Text>
          <Text className="text-xs text-ink-muted ml-2">{timeAgo(item.created_at)}</Text>
        </View>
        <Text className="text-ink-muted mt-1 leading-5">{item.message}</Text>
      </View>
      {item.coverUrl || item.bookTitle ? (
        <BookCover url={item.coverUrl} title={item.bookTitle} sizeClassName="w-12 h-16" />
      ) : null}
    </View>
  );
}
