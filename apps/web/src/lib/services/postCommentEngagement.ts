import { createClient } from "@/lib/supabase/client";
import { postFeedPath } from "@/lib/routes/posts";
import {
  createMentionNotification,
  createPostCommentReactionNotification,
  createPostCommentReplyNotification,
} from "@/lib/services/notifications";
import type { ContentReaction, PostCommentReplyWithAuthor, ReactionCounts } from "@/types";
import { extractMentionUsernames } from "@/lib/utils/mentions";
import { buildReplyThread, type ThreadNode } from "@/lib/utils/threadReplies";

const AUTHOR_SELECT = "id, username, display_name, avatar_url";

async function getViewerId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function fetchAuthors(userIds: string[]) {
  if (!userIds.length) return new Map<string, PostCommentReplyWithAuthor["author"]>();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(AUTHOR_SELECT)
    .in("id", userIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((profile) => [
      profile.id as string,
      {
        id: profile.id as string,
        username: profile.username as string | null,
        display_name: profile.display_name as string | null,
        avatar_url: profile.avatar_url as string | null,
      },
    ])
  );
}

export async function getPostCommentReactionCounts(
  commentIds: string[],
  viewerId: string | null
): Promise<Map<string, ReactionCounts>> {
  const map = new Map<string, ReactionCounts>();
  if (!commentIds.length) return map;

  const supabase = createClient();

  const [reactionsResult, viewerResult] = await Promise.all([
    supabase
      .from("post_comment_reactions")
      .select("comment_id, reaction")
      .in("comment_id", commentIds),
    viewerId
      ? supabase
          .from("post_comment_reactions")
          .select("comment_id, reaction")
          .eq("user_id", viewerId)
          .in("comment_id", commentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (reactionsResult.error) throw reactionsResult.error;
  if (viewerResult.error) throw viewerResult.error;

  const viewerByComment = new Map<string, ContentReaction>();
  for (const row of viewerResult.data ?? []) {
    viewerByComment.set(row.comment_id as string, row.reaction as ContentReaction);
  }

  for (const commentId of commentIds) {
    map.set(commentId, {
      like_count: 0,
      dislike_count: 0,
      viewer_reaction: viewerByComment.get(commentId) ?? null,
    });
  }

  for (const row of reactionsResult.data ?? []) {
    const commentId = row.comment_id as string;
    const counts = map.get(commentId);
    if (!counts) continue;
    if (row.reaction === "like") counts.like_count += 1;
    if (row.reaction === "dislike") counts.dislike_count += 1;
  }

  return map;
}

async function setPostCommentReaction(
  commentId: string,
  reaction: ContentReaction
): Promise<{ counts?: ReactionCounts; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();

  const { data: comment, error: commentError } = await supabase
    .from("post_comments")
    .select("id, user_id, post_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError) return { error: commentError.message };
  if (!comment) return { error: "Comment not found." };

  const { data: existing } = await supabase
    .from("post_comment_reactions")
    .select("reaction")
    .eq("comment_id", commentId)
    .eq("user_id", viewerId)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    const { error } = await supabase
      .from("post_comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", viewerId);

    if (error) return { error: error.message };
  } else if (existing) {
    const { error } = await supabase
      .from("post_comment_reactions")
      .update({ reaction })
      .eq("comment_id", commentId)
      .eq("user_id", viewerId);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("post_comment_reactions").insert({
      comment_id: commentId,
      user_id: viewerId,
      reaction,
    });

    if (error) return { error: error.message };
  }

  const countsMap = await getPostCommentReactionCounts([commentId], viewerId);
  const counts = countsMap.get(commentId);

  if (comment.user_id !== viewerId && counts?.viewer_reaction) {
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", viewerId)
      .maybeSingle();

    void createPostCommentReactionNotification({
      recipientId: comment.user_id as string,
      actorId: viewerId,
      actorDisplayName:
        actorProfile?.display_name?.trim() ||
        actorProfile?.username?.trim() ||
        "A reader",
      postId: comment.post_id as string,
      commentId,
      reaction: counts.viewer_reaction,
    });
  }

  return { counts };
}

export async function likePostComment(
  commentId: string
): Promise<{ counts?: ReactionCounts; error?: string }> {
  return setPostCommentReaction(commentId, "like");
}

export async function dislikePostComment(
  commentId: string
): Promise<{ counts?: ReactionCounts; error?: string }> {
  return setPostCommentReaction(commentId, "dislike");
}

export async function removePostCommentReaction(
  commentId: string
): Promise<{ counts?: ReactionCounts; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("post_comment_reactions")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", viewerId);

  if (error) return { error: error.message };

  const countsMap = await getPostCommentReactionCounts([commentId], viewerId);
  return { counts: countsMap.get(commentId) };
}

type PostCommentReplyNode = Omit<PostCommentReplyWithAuthor, "children">;

export async function listPostCommentReplies(
  commentId: string
): Promise<ThreadNode<PostCommentReplyNode>[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("post_comment_replies")
    .select("id, comment_id, user_id, parent_reply_id, body, created_at, updated_at")
    .eq("comment_id", commentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  const authorIds = [...new Set(rows.map((row) => row.user_id as string))];
  const authors = await fetchAuthors(authorIds);

  const flat = rows.map((row) => ({
    id: row.id as string,
    comment_id: row.comment_id as string,
    user_id: row.user_id as string,
    parent_reply_id: row.parent_reply_id as string | null,
    body: row.body as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: authors.get(row.user_id as string) ?? {
      id: row.user_id as string,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  }));

  return buildReplyThread(flat);
}

export async function addPostCommentReply(
  commentId: string,
  body: string,
  parentReplyId?: string | null
): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Reply cannot be empty." };

  const supabase = createClient();

  const { data: comment, error: commentError } = await supabase
    .from("post_comments")
    .select("id, user_id, post_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError) return { error: commentError.message };
  if (!comment) return { error: "Comment not found." };

  const { data, error } = await supabase
    .from("post_comment_replies")
    .insert({
      comment_id: commentId,
      user_id: viewerId,
      parent_reply_id: parentReplyId ?? null,
      body: trimmed,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", viewerId)
    .maybeSingle();

  const actorDisplayName =
    actorProfile?.display_name?.trim() ||
    actorProfile?.username?.trim() ||
    "A reader";

  if (comment.user_id !== viewerId) {
    void createPostCommentReplyNotification({
      recipientId: comment.user_id as string,
      actorId: viewerId,
      actorDisplayName,
      postId: comment.post_id as string,
      commentId,
      replyId: data.id as string,
      preview: trimmed,
    });
  }

  const mentionUsernames = extractMentionUsernames(trimmed);
  if (mentionUsernames.length) {
    const { data: mentionedProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("username", mentionUsernames);

    for (const profile of mentionedProfiles ?? []) {
      if (profile.id === viewerId) continue;
      void createMentionNotification({
        recipientId: profile.id as string,
        actorId: viewerId,
        actorDisplayName,
        linkUrl: postFeedPath(comment.post_id as string),
        preview: trimmed,
        dedupKey: `mention:post_comment_reply:${data.id}:${profile.id}`,
      });
    }
  }

  return {};
}

export async function deletePostCommentReply(replyId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("post_comment_replies")
    .delete()
    .eq("id", replyId)
    .eq("user_id", viewerId);

  if (error) return { error: error.message };
  return {};
}
