import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "./Avatar";
import { BookCover } from "./BookCover";
import { ProfanityBlur } from "./ProfanityBlur";
import { SpoilerReveal } from "./SpoilerReveal";
import { timeAgo } from "../utils";
import type { BookClubDiscussionWithAuthor, BookClubPostWithAuthor } from "../types";

type DiscussionCardItem = BookClubDiscussionWithAuthor | BookClubPostWithAuthor;

function authorName(author: DiscussionCardItem["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

function isForumDiscussion(
  post: DiscussionCardItem
): post is BookClubDiscussionWithAuthor {
  return "title" in post && typeof post.title === "string";
}

type Props = {
  post: DiscussionCardItem;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
  onPress?: () => void;
};

export function ClubDiscussionCard({
  post,
  canDelete,
  deleting,
  onDelete,
  onPress,
}: Props) {
  const router = useRouter();
  const username = post.author.username?.trim();
  const forum = isForumDiscussion(post);
  const title = forum ? post.title.trim() : "";
  const replyCount = forum ? post.reply_count : undefined;
  const pinned = forum ? post.is_pinned : false;
  const locked = forum ? post.is_locked : false;
  const spoilers = forum ? post.contains_spoilers : false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        title
          ? `${title}${pinned ? ", pinned" : ""}${locked ? ", locked" : ""}`
          : "Open discussion"
      }
      onPress={onPress}
      disabled={!onPress}
      className="mb-3 rounded-2xl border border-brand-border bg-surface p-4 active:opacity-90"
    >
      <View className="flex-row items-start gap-3">
        <Pressable
          onPress={() => username && router.push(`/reader/${username}`)}
          disabled={!username}
          className="shrink-0 active:opacity-80"
          accessibilityRole={username ? "link" : undefined}
          accessibilityLabel={authorName(post.author)}
        >
          <Avatar url={post.author.avatar_url} name={authorName(post.author)} size={36} />
        </Pressable>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start gap-2">
            <View className="min-w-0 flex-1">
              <Text className="text-left font-semibold text-ink" numberOfLines={1}>
                {authorName(post.author)}
              </Text>
              <Text className="text-left text-xs text-ink-muted">{timeAgo(post.created_at)}</Text>
            </View>
            {canDelete ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete discussion"
                disabled={deleting}
                onPress={onDelete}
                className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3 active:opacity-80"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#642F37" />
                ) : (
                  <Text className="text-xs font-semibold text-puce-red">Delete</Text>
                )}
              </Pressable>
            ) : null}
          </View>

          {title ? (
            <Text
              className="mt-2 text-left text-base font-semibold text-puce-red"
              numberOfLines={2}
            >
              {title}
            </Text>
          ) : null}

          <View className="mt-2 flex-row flex-wrap gap-2">
            {pinned ? (
              <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                Pinned
              </Text>
            ) : null}
            {locked ? (
              <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                Locked
              </Text>
            ) : null}
            {spoilers ? (
              <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                Spoilers
              </Text>
            ) : null}
            {typeof replyCount === "number" ? (
              <Text className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </Text>
            ) : null}
          </View>

          <SpoilerReveal enabled={spoilers} className="mt-3">
            <ProfanityBlur text={post.body}>
              <Text className="text-left leading-6 text-ink" numberOfLines={4}>
                {post.body}
              </Text>
            </ProfanityBlur>
          </SpoilerReveal>

          {post.book ? (
            <Pressable
              onPress={() => router.push(`/book/${post.book!.id}`)}
              className="mt-3 flex-row items-center gap-3 rounded-xl bg-background p-2 active:opacity-80"
            >
              <BookCover
                url={post.book.cover_url}
                title={post.book.title}
                sizeClassName="w-10 h-14"
              />
              <View className="min-w-0 flex-1">
                <Text className="text-left text-sm font-medium text-ink" numberOfLines={2}>
                  {post.book.title}
                </Text>
                {post.book.author ? (
                  <Text className="text-left text-xs text-ink-muted" numberOfLines={1}>
                    {post.book.author}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
