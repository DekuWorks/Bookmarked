import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { AttachmentImage } from "./AttachmentImage";
import { BookCover } from "./BookCover";
import { FeelingChip } from "./FeelingChip";
import { MentionText } from "./MentionText";
import { PostCommentsSheet } from "./PostCommentsSheet";
import { RepostPreview } from "./RepostPreview";
import { StarRating } from "./StarRating";
import { timeAgo } from "../utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToggleReviewLike, useRepostPost, useTogglePostLike } from "../hooks/useFeed";
import { deletePost } from "../services/posts";
import { setShelfStatus } from "../services/library";
import { useAuthStore } from "../store/authStore";
import type { DiscussionEntry, FeedEntry, PostEntry, ReviewEntry } from "../services/socialFeed";

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-4 rounded-2xl border border-brand-border bg-surface p-4">{children}</View>
  );
}

function AuthorRow({
  entry,
  action,
}: {
  entry: FeedEntry;
  action: string;
}) {
  return (
    <View className="flex-row items-center">
      <Avatar url={entry.author.avatarUrl} name={entry.author.name} size={40} />
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-ink" numberOfLines={1}>
          {entry.author.name}
        </Text>
        <Text className="text-xs text-ink-muted">{action}</Text>
      </View>
      <Text className="text-xs text-ink-muted">{timeAgo(entry.createdAt)}</Text>
      <Text className="ml-2 text-lg text-ink-muted">⋯</Text>
    </View>
  );
}

function ActionRow({
  likeCount,
  liked,
  onLike,
  onComment,
  onSave,
}: {
  likeCount: number;
  liked: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
}) {
  return (
    <View className="mt-3 flex-row items-center gap-6 border-t border-brand-border pt-3">
      <Pressable className="flex-row items-center gap-1.5 active:opacity-70" onPress={onLike}>
        <Text className="text-base">{liked ? "❤️" : "🤍"}</Text>
        <Text className="text-sm text-ink-muted">{likeCount}</Text>
      </Pressable>
      <Pressable className="flex-row items-center gap-1.5 active:opacity-70" onPress={onComment}>
        <Text className="text-base">💬</Text>
      </Pressable>
      <View className="flex-1" />
      <Pressable className="active:opacity-70" onPress={onSave}>
        <Text className="text-base">🔖</Text>
      </Pressable>
    </View>
  );
}

function ReviewCard({ entry, viewerId }: { entry: ReviewEntry; viewerId?: string }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const like = useToggleReviewLike();
  const hidden = entry.hasSpoilers && !revealed;

  async function save() {
    if (!viewerId || !entry.book) return;
    const result = await setShelfStatus(
      viewerId,
      { id: entry.book.id, title: entry.book.title, cover_url: entry.book.coverUrl },
      "want_to_read"
    );
    Alert.alert(result.error ? "Couldn't save" : "Saved", result.error ?? "Added to your TBR shelf.");
  }

  return (
    <CardShell>
      <AuthorRow entry={entry} action="reviewed a book" />
      <Pressable
        className="mt-3 flex-row gap-3 active:opacity-80"
        onPress={() => entry.book && router.push(`/book/${entry.book.id}`)}
      >
        {entry.book ? (
          <BookCover
            url={entry.book.coverUrl}
            title={entry.book.title}
            sizeClassName="w-20 h-28"
            saved
          />
        ) : null}
        <View className="flex-1">
          <Text className="font-bold text-ink" numberOfLines={2}>
            {entry.book?.title ?? "A book"}
          </Text>
          {entry.book?.author ? (
            <Text className="text-sm text-ink-muted" numberOfLines={1}>
              by {entry.book.author}
            </Text>
          ) : null}
          {entry.rating != null ? (
            <View className="mt-1">
              <StarRating value={entry.rating} showNumber />
            </View>
          ) : null}
          {entry.ratingEmoji ? <Text className="mt-1 text-base">{entry.ratingEmoji}</Text> : null}
        </View>
      </Pressable>

      {entry.reviewBody ? (
        hidden ? (
          <Pressable
            onPress={() => setRevealed(true)}
            className="mt-3 flex-row items-center gap-2 rounded-xl bg-primary/10 px-3 py-3 active:opacity-80"
          >
            <Text className="text-base text-puce-red">🔒</Text>
            <Text className="text-sm font-medium text-puce-red">
              Spoiler review (tap to view)
            </Text>
          </Pressable>
        ) : (
          <Text className="mt-3 leading-5 text-ink">{entry.reviewBody}</Text>
        )
      ) : null}

      {entry.feelings.length ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {entry.feelings.map((feeling, i) => (
            <FeelingChip key={feeling} label={feeling} index={i} />
          ))}
        </View>
      ) : null}

      <ActionRow
        likeCount={entry.likeCount}
        liked={entry.viewerLiked}
        onLike={() => like.mutate(entry.id)}
        onComment={() => entry.book && router.push(`/book/${entry.book.id}`)}
        onSave={save}
      />
    </CardShell>
  );
}

function PostActions({
  likeCount,
  liked,
  commentCount,
  reposted,
  onLike,
  onComment,
  onRepost,
}: {
  likeCount: number;
  liked: boolean;
  commentCount: number;
  reposted: boolean;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
}) {
  return (
    <View className="mt-3 flex-row items-center gap-6 border-t border-brand-border pt-3">
      <Pressable className="flex-row items-center gap-1.5 active:opacity-70" onPress={onLike}>
        <Text className="text-base">{liked ? "❤️" : "🤍"}</Text>
        <Text className="text-sm text-ink-muted">{likeCount}</Text>
      </Pressable>
      <Pressable className="flex-row items-center gap-1.5 active:opacity-70" onPress={onComment}>
        <Text className="text-base">💬</Text>
        <Text className="text-sm text-ink-muted">{commentCount}</Text>
      </Pressable>
      <Pressable className="flex-row items-center gap-1.5 active:opacity-70" onPress={onRepost}>
        <Text className="text-base" style={{ opacity: reposted ? 1 : 0.55 }}>
          🔁
        </Text>
      </Pressable>
    </View>
  );
}

function PostCard({ entry, viewerId }: { entry: PostEntry; viewerId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const post = entry.post;
  const like = useTogglePostLike();
  const repost = useRepostPost();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const isRepost = Boolean(post.repost_of_post_id);
  const mine = post.user_id === viewerId;

  function onRepost() {
    if (isRepost) return;
    Alert.alert("Repost", "Share this post with your followers?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Quote",
        onPress: () => router.push(`/compose?repostOf=${post.id}`),
      },
      {
        text: post.viewer_has_reposted ? "Already reposted" : "Repost",
        onPress: () => {
          if (post.viewer_has_reposted) return;
          repost.mutate(
            { postId: post.id },
            {
              onSuccess: (result) => {
                if (result.error) Alert.alert("Couldn't repost", result.error);
              },
            }
          );
        },
      },
    ]);
  }

  function onMore() {
    if (!mine) return;
    Alert.alert("Post", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await deletePost(post.id);
          if (result.error) Alert.alert("Couldn't delete", result.error);
          else queryClient.invalidateQueries({ queryKey: ["home-feed"] });
        },
      },
    ]);
  }

  return (
    <CardShell>
      <View className="flex-row items-center">
        <Avatar url={entry.author.avatarUrl} name={entry.author.name} size={40} />
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-ink" numberOfLines={1}>
            {entry.author.name}
          </Text>
          <Text className="text-xs text-ink-muted">
            {isRepost ? "reposted" : "shared a post"}
          </Text>
        </View>
        <Text className="text-xs text-ink-muted">{timeAgo(entry.createdAt)}</Text>
        {mine ? (
          <Pressable onPress={onMore} className="ml-2 active:opacity-60">
            <Text className="text-lg text-ink-muted">⋯</Text>
          </Pressable>
        ) : (
          <Text className="ml-2 text-lg text-ink-muted">⋯</Text>
        )}
      </View>

      {post.body ? <MentionText body={post.body} className="mt-3 leading-5 text-ink" /> : null}

      {post.image_url ? (
        <View className="mt-3">
          <AttachmentImage url={post.image_url} />
        </View>
      ) : null}

      {isRepost && post.repost_of ? (
        <RepostPreview original={post.repost_of} />
      ) : isRepost ? (
        <View className="mt-3 rounded-xl border border-brand-border bg-background p-3">
          <Text className="text-sm text-ink-muted">The original post is unavailable.</Text>
        </View>
      ) : null}

      {post.book && !isRepost ? (
        <Pressable
          className="mt-3 flex-row items-center gap-3 rounded-xl bg-primary/10 p-2 active:opacity-80"
          onPress={() => post.book && router.push(`/book/${post.book.id}`)}
        >
          <BookCover
            url={post.book.cover_url}
            title={post.book.title}
            sizeClassName="w-10 h-14"
            saved
            ribbonSize={14}
          />
          <View className="flex-1">
            <Text className="font-medium text-ink" numberOfLines={1}>
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

      <PostActions
        likeCount={post.like_count}
        liked={post.viewer_has_liked}
        commentCount={post.comment_count}
        reposted={post.viewer_has_reposted}
        onLike={() => like.mutate({ postId: post.id, liked: post.viewer_has_liked })}
        onComment={() => setCommentsOpen(true)}
        onRepost={onRepost}
      />

      <PostCommentsSheet
        postId={post.id}
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </CardShell>
  );
}

function DiscussionCard({ entry }: { entry: DiscussionEntry }) {
  const router = useRouter();
  const extra = Math.max(0, entry.participantCount - entry.participantAvatars.length);

  return (
    <CardShell>
      <AuthorRow entry={entry} action="started a discussion" />
      <Text className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary-dark">
        {entry.clubName}
      </Text>
      <View className="mt-1 flex-row gap-3">
        {entry.book ? (
          <BookCover url={entry.book.coverUrl} title={entry.book.title} sizeClassName="w-14 h-20" />
        ) : null}
        <View className="flex-1">
          <Text className="font-bold text-ink" numberOfLines={3}>
            {entry.body}
          </Text>
          {entry.book ? (
            <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
              {entry.book.title}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="flex-row">
            {entry.participantAvatars.map((url, i) => (
              <View key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                <Avatar url={url} name="" size={24} />
              </View>
            ))}
          </View>
          {extra > 0 ? (
            <Text className="ml-2 text-xs text-ink-muted">+{extra} joined</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push(`/clubs/${entry.clubId}`)}
          className="rounded-full bg-puce-red px-4 py-2 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">Join Discussion →</Text>
        </Pressable>
      </View>
    </CardShell>
  );
}

export function FeedPostCard({ entry }: { entry: FeedEntry }) {
  const viewerId = useAuthStore((s) => s.user?.id);
  if (entry.kind === "review") return <ReviewCard entry={entry} viewerId={viewerId} />;
  if (entry.kind === "post") return <PostCard entry={entry} viewerId={viewerId} />;
  return <DiscussionCard entry={entry} />;
}
