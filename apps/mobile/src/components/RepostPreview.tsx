import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { AttachmentImage } from "./AttachmentImage";
import { BookCover } from "./BookCover";
import { MentionText } from "./MentionText";
import type { PostWithAuthor } from "../types";

/**
 * Embedded quoted/reposted original inside a repost card. Mirrors the web
 * `RepostPreview`: shows the original author, its text, any image/GIF, and the
 * attached book (cover + "B" ribbon badge).
 */
export function RepostPreview({ original }: { original: PostWithAuthor }) {
  const router = useRouter();
  const name =
    original.author.display_name?.trim() || original.author.username?.trim() || "Reader";
  const username = original.author.username?.trim();

  return (
    <View className="mt-3 rounded-xl border border-brand-border bg-background p-3">
      <Pressable
        onPress={() => username && router.push(`/reader/${username}`)}
        disabled={!username}
        className="flex-row items-center active:opacity-80"
        accessibilityRole={username ? "link" : undefined}
      >
        <Avatar url={original.author.avatar_url} name={name} size={24} />
        <Text className="ml-2 text-sm font-semibold text-ink" numberOfLines={1}>
          {name}
        </Text>
        {username ? (
          <Text className="ml-1 text-xs text-ink-muted" numberOfLines={1}>
            @{username}
          </Text>
        ) : null}
      </Pressable>

      {original.body ? (
        <MentionText body={original.body} className="mt-2 leading-5 text-ink" />
      ) : null}

      {original.image_url ? (
        <View className="mt-2">
          <AttachmentImage url={original.image_url} compact />
        </View>
      ) : null}

      {original.book ? (
        <Pressable
          onPress={() => original.book && router.push(`/book/${original.book.id}`)}
          className="mt-2 flex-row items-center gap-2 rounded-lg bg-primary/10 p-2 active:opacity-80"
        >
          <BookCover
            url={original.book.cover_url}
            title={original.book.title}
            sizeClassName="w-8 h-12"
            saved
            badgeSize="small"
          />
          <View className="flex-1">
            <Text className="text-sm font-medium text-ink" numberOfLines={1}>
              {original.book.title}
            </Text>
            {original.book.author ? (
              <Text className="text-xs text-ink-muted" numberOfLines={1}>
                {original.book.author}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
