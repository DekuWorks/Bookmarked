import { supabase } from "./supabase";
import { requireModeration } from "./moderateUgc";
import {
  createMentionNotification,
  createPostCommentReactionNotification,
  createPostCommentReplyNotification,
  getActorDisplayName,
  postFeedPath,
} from "./notifications";
import { extractMentionUsernames } from "../utils/mentions";
import { normalizeCommentAttachmentUrl } from "../utils/attachments";
import type {
  ContentReaction,
  PostAuthor,
  PostCommentReply,
  PostCommentReplyWithAuthor,
  ReactionCounts,
} from "../types";

/**
 * Comment reactions (like/dislike) + threaded replies on post comments. Full
 * port of apps/web/src/lib/services/postCommentEngagement.ts against
 * `post_comment_reactions` and `post_comment_replies` + RLS.
 */

const AUTHOR_SELECT = "id, username, display_name, avatar_url";
const REPLY_SELECT =
  "id, comment_id, user_id, parent_reply_id, body, attachment_url, created_at, updated_at";

export type ReplyNode = PostCommentReplyWithAuthor & { children: ReplyNode[] };

async function getViewerId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function fetchAuthors(userIds: string[]): Promise<Map<string, PostAuthor>> {
  const map = new Map<string, PostAuthor>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return map;
  const { data } = await supabase.from("profiles").select(AUTHOR_SELECT).in("id", unique);
  for (const row of data ?? []) {
    map.set(row.id as string, {
      id: row.id as string,
      username: row.username as string | null,
      display_name: row.display_name as string | null,
      avatar_url: row.avatar_url as string | null,
    });
  }
  return map;
}

export async function getPostCommentReactionCounts(
  commentIds: string[],
  viewerId: string | null
): Promise<Map<string, ReactionCounts>> {
  const map = new Map<string, ReactionCounts>();
  for (const id of commentIds) {
    map.set(id, { like_count: 0, dislike_count: 0, viewer_reaction: null });
  }
  if (!commentIds.length) return map;

  const [all, viewer] = await Promise.all([
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
      : Promise.resolve({ data: [] as { comment_id: string; reaction: ContentReaction }[] }),
  ]);

  for (const row of all.data ?? []) {
    const entry = map.get(row.comment_id as string);
    if (!entry) continue;
    if (row.reaction === "like") entry.like_count += 1;
    else if (row.reaction === "dislike") entry.dislike_count += 1;
  }
  for (const row of (viewer.data ?? []) as { comment_id: string; reaction: ContentReaction }[]) {
    const entry = map.get(row.comment_id);
    if (entry) entry.viewer_reaction = row.reaction;
  }
  return map;
}

async function setPostCommentReaction(
  commentId: string,
  reaction: ContentReaction
): Promise<{ counts?: ReactionCounts; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const { data: comment } = await supabase
    .from("post_comments")
    .select("id, user_id, post_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) return { error: "Comment not found." };

  const { data: existing } = await supabase
    .from("post_comment_reactions")
    .select("reaction")
    .eq("comment_id", commentId)
    .eq("user_id", viewerId)
    .maybeSingle();

  let removed = false;
  if (existing?.reaction === reaction) {
    const { error } = await supabase
      .from("post_comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", viewerId);
    if (error) return { error: error.message };
    removed = true;
  } else if (existing) {
    const { error } = await supabase
      .from("post_comment_reactions")
      .update({ reaction })
      .eq("comment_id", commentId)
      .eq("user_id", viewerId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("post_comment_reactions")
      .insert({ comment_id: commentId, user_id: viewerId, reaction });
    if (error) return { error: error.message };
  }

  if (!removed && comment.user_id !== viewerId) {
    const actorName = await getActorDisplayName(viewerId);
    void createPostCommentReactionNotification({
      recipientId: comment.user_id as string,
      actorId: viewerId,
      actorDisplayName: actorName,
      postId: comment.post_id as string,
      commentId,
    });
  }

  const counts = await getPostCommentReactionCounts([commentId], viewerId);
  return { counts: counts.get(commentId) };
}

export function likePostComment(commentId: string) {
  return setPostCommentReaction(commentId, "like");
}

export function dislikePostComment(commentId: string) {
  return setPostCommentReaction(commentId, "dislike");
}

export async function removePostCommentReaction(
  commentId: string
): Promise<{ counts?: ReactionCounts; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };
  const { error } = await supabase
    .from("post_comment_reactions")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", viewerId);
  if (error) return { error: error.message };
  const counts = await getPostCommentReactionCounts([commentId], viewerId);
  return { counts: counts.get(commentId) };
}

function buildReplyTree(rows: PostCommentReplyWithAuthor[]): ReplyNode[] {
  const nodes = new Map<string, ReplyNode>();
  const roots: ReplyNode[] = [];
  for (const row of rows) nodes.set(row.id, { ...row, children: [] });
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    if (row.parent_reply_id && nodes.has(row.parent_reply_id)) {
      nodes.get(row.parent_reply_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function listPostCommentReplies(commentId: string): Promise<ReplyNode[]> {
  const { data, error } = await supabase
    .from("post_comment_replies")
    .select(REPLY_SELECT)
    .eq("comment_id", commentId)
    .order("created_at", { ascending: true });
  if (error) return [];
  const rows = (data ?? []) as PostCommentReply[];
  const authors = await fetchAuthors(rows.map((r) => r.user_id));
  const withAuthors: PostCommentReplyWithAuthor[] = rows.map((row) => ({
    ...row,
    author: authors.get(row.user_id) ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  }));
  return buildReplyTree(withAuthors);
}

export async function addPostCommentReply(
  commentId: string,
  body: string,
  parentReplyId?: string | null,
  attachmentUrl?: string | null
): Promise<{ replyId?: string; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const trimmed = body.trim();
  let attachment: string | null = null;
  if (attachmentUrl) {
    attachment = normalizeCommentAttachmentUrl(attachmentUrl);
    if (!attachment) return { error: "Attachment must be a Giphy link or an uploaded image." };
  }
  if (!trimmed && !attachment) return { error: "Reply cannot be empty." };

  if (trimmed) {
    const gate = await requireModeration({ text: trimmed, contentType: "COMMENT" });
    if (gate.error) return { error: gate.error };
  }

  const { data: comment } = await supabase
    .from("post_comments")
    .select("id, user_id, post_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) return { error: "Comment not found." };

  const { data, error } = await supabase
    .from("post_comment_replies")
    .insert({
      comment_id: commentId,
      user_id: viewerId,
      parent_reply_id: parentReplyId ?? null,
      body: trimmed,
      attachment_url: attachment,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const replyId = data.id as string;
  const actorName = await getActorDisplayName(viewerId);
  if (comment.user_id !== viewerId) {
    void createPostCommentReplyNotification({
      recipientId: comment.user_id as string,
      actorId: viewerId,
      actorDisplayName: actorName,
      postId: comment.post_id as string,
      replyId,
      preview: trimmed,
    });
  }
  // Notify @mentions in the reply body.
  const usernames = extractMentionUsernames(trimmed);
  if (usernames.length) {
    const { data: mentioned } = await supabase
      .from("profiles")
      .select("id, username")
      .in("username", usernames);
    for (const profile of mentioned ?? []) {
      if (profile.id === viewerId) continue;
      void createMentionNotification({
        recipientId: profile.id as string,
        actorId: viewerId,
        actorDisplayName: actorName,
        linkUrl: postFeedPath(comment.post_id as string),
        preview: trimmed,
        dedupKey: `mention:post_comment_reply:${replyId}:${profile.id}`,
        postId: comment.post_id as string,
      });
    }
  }

  return { replyId };
}

export async function deletePostCommentReply(replyId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };
  const { error } = await supabase
    .from("post_comment_replies")
    .delete()
    .eq("id", replyId)
    .eq("user_id", viewerId);
  if (error) return { error: error.message };
  return {};
}
