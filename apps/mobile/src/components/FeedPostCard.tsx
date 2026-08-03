import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "./Avatar";
import { AttachmentImage } from "./AttachmentImage";
import { BookCover } from "./BookCover";
import { FeelingChip } from "./FeelingChip";
import { BookmarkedLikeSparkles } from "./BookmarkedLikeSparkles";
import { MentionText } from "./MentionText";
import { PostCommentsSheet } from "./PostCommentsSheet";
import { ProfanityBlur } from "./ProfanityBlur";
import { RepostPreview } from "./RepostPreview";
import { ShareContentSheet } from "./ShareContentSheet";
import {
  buildPostShareComposerPayload,
  buildReviewShareComposerPayload,
} from "../../../../packages/utils/sharePreview";
import { StarRating } from "./StarRating";
import { showContentActions } from "./ContentActions";
import { timeAgo } from "../utils";
import { useToggleReviewLike, useRepostPost, useTogglePostLike } from "../hooks/useFeed";
import { deletePost } from "../services/posts";
import { setShelfStatus } from "../services/library";
import { useAuthStore } from "../store/authStore";
import type { DiscussionEntry, FeedEntry, PostEntry, ReviewEntry } from "../services/socialFeed";

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-4 rounded-2xl border border-brand-border bg-surface p-4 shadow-md">
      {children}
    </View>
  );
}

function AuthorRow({
  entry,
  action,
  onMore,
}: {
  entry: FeedEntry;
  action: string;
  onMore?: () => void;
}) {
  const router = useRouter();
  const username = entry.author.username?.trim();

  function goToProfile() {
    if (username) router.push(`/reader/${username}`);
  }

  return (
    <Pressable
      onPress={goToProfile}
      disabled={!username}
      className="flex-row items-center active:opacity-80"
      accessibilityRole={username ? "link" : undefined}
      accessibilityLabel={username ? `View ${entry.author.name}'s profile` : undefined}
    >
      <Avatar url={entry.author.avatarUrl} name={entry.author.name} size={40} />
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-ink" numberOfLines={1}>
          {entry.author.name}
        </Text>
        <Text className="text-xs text-ink-muted">{action}</Text>
      </View>
      <Text className="text-xs text-ink-muted">{timeAgo(entry.createdAt)}</Text>
      {onMore ? (
        <Pressable onPress={onMore} className="ml-2 active:opacity-60" hitSlop={8}>
          <Text className="text-lg text-ink-muted">⋯</Text>
        </Pressable>
      ) : (
        <Text className="ml-2 text-lg text-ink-muted">⋯</Text>
      )}
    </Pressable>
  );
}

function ActionRow({
  likeCount,
  liked,
  showAnimation,
  onLike,
  onComment,
  onSave,
  onShare,
}: {
  likeCount: number;
  liked: boolean;
  showAnimation?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}) {
  return (
    <View className="mt-3 flex-row items-center gap-6 border-t border-brand-border pt-3">
      <Pressable
        className="relative flex-row items-center gap-1.5 active:opacity-70"
        style={{ overflow: "visible" }}
        onPress={onLike}
      >
        <BookmarkedLikeSparkles active={Boolean(showAnimation)} />
        <Text className="text-base">{liked ? "❤️" : "🤍"}</Text>
        <Text className="text-sm text-ink-muted">{likeCount}</Text>
      </Pressable>
      <Pressable className="flex-row items-center gap-1.5 active:opacity-70" onPress={onComment}>
        <Text className="text-base">💬</Text>
      </Pressable>
      {onShare ? (
        <Pressable className="active:opacity-70" onPress={onShare}>
          <Text className="text-base">↗</Text>
        </Pressable>
      ) : null}
      <View className="flex-1" />
      <Pressable className="active:opacity-70" onPress={onSave}>
        <Text className="text-base">🔖</Text>
      </Pressable>
    </View>
  );
}

function ReviewCard({ entry, viewerId }: { entry: ReviewEntry; viewerId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [revealed, setRevealed] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const like = useToggleReviewLike();
  const hidden = entry.hasSpoilers && !revealed;
  const isSelf = entry.author.id === viewerId;
  const sharePayload = buildReviewShareComposerPayload({
    reviewId: entry.id,
    body: entry.reviewBody?.trim() || `${entry.author.name} shared a review`,
    authorName: entry.author.name,
    authorAvatarUrl: entry.author.avatarUrl,
    bookTitle: entry.book?.title,
    bookCoverUrl: entry.book?.coverUrl,
    bookId: entry.book?.id ?? null,
    rating: entry.rating ?? null,
    spoiler: Boolean(entry.hasSpoilers),
    createdAt: entry.createdAt,
    destinationPath: entry.book ? `/book/${entry.book.id}` : "/feed",
  });

  function onMore() {
    if (isSelf) return;
    showContentActions({
      contentType: "review",
      contentId: entry.id,
      reportedUserId: entry.author.id,
      reportedUserName: entry.author.name,
      onBlocked: () => queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
    });
  }

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
      <AuthorRow entry={entry} action="reviewed a book" onMore={isSelf ? undefined : onMore} />
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
          <ProfanityBlur text={entry.reviewBody} className="mt-3">
            <Text className="leading-5 text-ink">{entry.reviewBody}</Text>
          </ProfanityBlur>
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
        showAnimation={showAnimation}
        onLike={() => {
          if (!entry.viewerLiked) {
            setShowAnimation(true);
            setTimeout(() => setShowAnimation(false), 1200);
          }
          like.mutate(entry.id);
        }}
        onComment={() => entry.book && router.push(`/book/${entry.book.id}`)}
        onSave={save}
        onShare={() => setShareOpen(true)}
      />
      {viewerId ? (
        <ShareContentSheet
          visible={shareOpen}
          currentUserId={viewerId}
          payload={sharePayload}
          onClose={() => setShareOpen(false)}
          onSharedToFeed={() => queryClient.invalidateQueries({ queryKey: ["home-feed"] })}
        />
      ) : null}
    </CardShell>
  );
}

function PostActions({
  likeCount,
  liked,
  commentCount,
  reposted,
  showAnimation,
  onLike,
  onComment,
  onRepost,
  onShare,
}: {
  likeCount: number;
  liked: boolean;
  commentCount: number;
  reposted: boolean;
  showAnimation?: boolean;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onShare?: () => void;
}) {
  return (
    <View className="mt-3 flex-row items-center gap-6 border-t border-brand-border pt-3">
      <Pressable
        className="relative flex-row items-center gap-1.5 active:opacity-70"
        style={{ overflow: "visible" }}
        onPress={onLike}
      >
        <BookmarkedLikeSparkles active={Boolean(showAnimation)} />
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
      {onShare ? (
        <Pressable className="active:opacity-70" onPress={onShare}>
          <Text className="text-base">↗</Text>
        </Pressable>
      ) : null}
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
  const [showAnimation, setShowAnimation] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const isRepost = Boolean(post.repost_of_post_id);
  const mine = post.user_id === viewerId;
  const sharePayload = buildPostShareComposerPayload({
    postId: post.id,
    body: post.body?.trim() || `${entry.author.name} shared a post`,
    authorName: entry.author.name,
    authorAvatarUrl: entry.author.avatarUrl,
    bookTitle: post.book?.title,
    bookCoverUrl: post.book?.cover_url,
    bookId: post.book?.id ?? null,
    imageUrl: post.image_url,
    createdAt: post.created_at,
    destinationPath: `/feed?post=${post.id}`,
    edited: Boolean(post.updated_at && post.updated_at !== post.created_at),
  });

  function onMore() {
    if (mine) {
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
      return;
    }
    showContentActions({
      contentType: "post",
      contentId: post.id,
      reportedUserId: entry.author.id,
      reportedUserName: entry.author.name,
      onBlocked: () => queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
    });
  }

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
        <Pressable onPress={onMore} className="ml-2 active:opacity-60" hitSlop={8}>
          <Text className="text-lg text-ink-muted">⋯</Text>
        </Pressable>
      </View>

      {post.body ? (
        <MentionText body={post.body} className="mt-3 text-left leading-5 text-ink" />
      ) : null}

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
          className="mt-3 overflow-visible rounded-xl border border-primary/30 bg-primary/15 active:opacity-80"
          onPress={() => post.book && router.push(`/book/${post.book.id}`)}
        >
          <View className="flex-row items-stretch gap-3 p-3">
            <BookCover
              url={post.book.cover_url}
              title={post.book.title}
              sizeClassName="w-14 h-[5.25rem]"
              saved
              badgeSize="medium"
            />
            <View className="flex-1 justify-center py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-primary-dark">
                Book
              </Text>
              <Text className="mt-1 text-base font-semibold leading-snug text-ink" numberOfLines={2}>
                {post.book.title}
              </Text>
              {post.book.author ? (
                <Text className="mt-1 text-sm text-ink-muted" numberOfLines={1}>
                  {post.book.author}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      ) : null}

      <PostActions
        likeCount={post.like_count}
        liked={post.viewer_has_liked}
        commentCount={post.comment_count}
        reposted={post.viewer_has_reposted}
        showAnimation={showAnimation}
        onLike={() => {
          if (!post.viewer_has_liked) {
            setShowAnimation(true);
            setTimeout(() => setShowAnimation(false), 1200);
          }
          like.mutate({ postId: post.id, liked: post.viewer_has_liked });
        }}
        onComment={() => setCommentsOpen(true)}
        onRepost={onRepost}
        onShare={() => setShareOpen(true)}
      />

      <PostCommentsSheet
        postId={post.id}
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
      {viewerId ? (
        <ShareContentSheet
          visible={shareOpen}
          currentUserId={viewerId}
          payload={sharePayload}
          onClose={() => setShareOpen(false)}
          onSharedToFeed={() => queryClient.invalidateQueries({ queryKey: ["home-feed"] })}
        />
      ) : null}
    </CardShell>
  );
}

function DiscussionCard({ entry }: { entry: DiscussionEntry }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const extra = Math.max(0, entry.participantCount - entry.participantAvatars.length);

  function onMore() {
    showContentActions({
      contentType: "club_post",
      contentId: entry.id,
      reportedUserId: entry.author.id,
      reportedUserName: entry.author.name,
      onBlocked: () => queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
    });
  }

  return (
    <CardShell>
      <AuthorRow entry={entry} action="started a discussion" onMore={onMore} />
      <Text className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary-dark">
        {entry.clubName}
      </Text>
      <View className="mt-1 flex-row gap-3">
        {entry.book ? (
          <BookCover url={entry.book.coverUrl} title={entry.book.title} sizeClassName="w-14 h-20" />
        ) : null}
        <View className="flex-1">
          <ProfanityBlur text={entry.body}>
            <Text className="font-bold text-ink" numberOfLines={3}>
              {entry.body}
            </Text>
          </ProfanityBlur>
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
