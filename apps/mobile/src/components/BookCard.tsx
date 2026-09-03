import type { ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { BookCover } from "./BookCover";

type Props = PressableProps & {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  subtitle?: string | null;
  /** Show the saved bookmark when the book is already in the library. */
  saved?: boolean;
  /** Optional trailing accessory, e.g. a current-shelf badge in Search results. */
  rightAccessory?: ReactNode;
};

export function BookCard({ title, author, coverUrl, subtitle, saved, rightAccessory, ...rest }: Props) {
  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-3 mb-3 active:opacity-80"
      {...rest}
    >
      <BookCover url={coverUrl} title={title} sizeClassName="w-14 h-20" saved={saved} badgeSize="small" />
      <View className="flex-1 justify-center">
        <Text className="font-semibold text-ink" numberOfLines={2}>
          {title}
        </Text>
        {author ? (
          <Text className="text-ink-muted mt-0.5" numberOfLines={1}>
            {author}
          </Text>
        ) : null}
        {subtitle ? (
          <Text className="text-xs text-primary-dark mt-1" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAccessory ? <View className="shrink-0">{rightAccessory}</View> : null}
    </Pressable>
  );
}
