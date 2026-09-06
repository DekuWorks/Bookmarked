import { supabase } from "./supabase";
import { requireModeration } from "./moderateUgc";
import {
  createMentionNotification,
  createPostCommentNotification,
  createPostLikeNotification,
  getActorDisplayName,
  postFeedPath,
} from "./notifications";
import { extractMentionUsernames } from "../utils/mentions";
import { normalizeCommentAttachmentUrl } from "../utils/attachments";
import type {
  PostAuthor,
  PostComment,
  PostCommentWithAuthor,
  PostWithAuthor,
} from "../types";

/**
 * Mobile posts service. Full port of apps/web/src/lib/services/posts.ts against
 * the same `posts`, `post_likes`, `post_comments` tables + RLS and the
 * `post-images` Storage bucket: create posts (text + image/GIF + @mentions),
 * feed listing with batched `.in()` hydration (authors, books, engagement,
 * reposts), likes, comments, reposts/quote-reposts, and delete.
 */

const POST_SELECT =
  "id, user_id, body, image_url, book_id, repost_of_post_id, source_type, source_id, moderation_meta, created_at, updated_at";
const AUTHOR_SELECT = "id, username, display_name, avatar_url";
const COMMENT_SELECT =
  "id, post_id, user_id, body, attachment_url, moderation_meta, created_at, updated_at";

export type CreatePostInput = {
  body: string;
  bookId?: string | null;
  imageUrl?: string | null;
  sourceType?: "review" | "note" | null;
  sourceId?: string | null;
};

export type RepostInput = {
  body?: string;
  imageUrl?: string | null;
  bookId?: string | null;
};

type RawPostRow = {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  book_id: string | null;
  repost_of_post_id: string | null;
  created_at: string;
  updated_at: string;
};

type BookLite = { id: string; title: string; author: string | null; cover_url: string | null };

async function getViewerId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function trimBody(body: string): string {
  return body.trim();
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

async function fetchBooks(bookIds: string[]): Promise<Map<string, BookLite>> {
  const map = new Map<string, BookLite>();
  const unique = [...new Set(bookIds.filter(Boolean))];
  if (!unique.length) return map;
  const { data } = await supabase
    .from("books")
    .select("id, title, author, cover_url")
    .in("id", unique);
  for (const row of data ?? []) {
    map.set(row.id as string, {
      id: row.id as string,
      title: row.title as string,
      author: row.author as string | null,
      cover_url: row.cover_url as string | null,
    });
  }
  return map;
}

type Engagement = {
  like_count: number;
  comment_count: number;
  viewer_has_liked: boolean;
  viewer_has_reposted: boolean;
};

async function fetchEngagement(
  postIds: string[],
  viewerId: string
): Promise<Map<string, Engagement>> {
  const map = new Map<string, Engagement>();
  for (const id of postIds) {
    map.set(id, {
      like_count: 0,
      comment_count: 0,
      viewer_has_liked: false,
      viewer_has_reposted: false,
    });
  }
  if (!postIds.length) return map;

  const [likes, comments, viewerLikes, viewerReposts] = await Promise.all([
    supabase.from("post_likes").select("post_id").in("post_id", postIds),
    supabase.from("post_comments").select("post_id").in("post_id", postIds),
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", viewerId)
      .in("post_id", postIds),
    supabase
      .from("posts")
      .select("repost_of_post_id")
      .eq("user_id", viewerId)
      .in("repost_of_post_id", postIds),
  ]);

  for (const row of likes.data ?? []) {
    const e = map.get(row.post_id as string);
    if (e) e.like_count += 1;
  }
  for (const row of comments.data ?? []) {
    const e = map.get(row.post_id as string);
    if (e) e.comment_count += 1;
  }
  for (const row of viewerLikes.data ?? []) {
    const e = map.get(row.post_id as string);
    if (e) e.viewer_has_liked = true;
  }
  for (const row of viewerReposts.data ?? []) {
    const e = map.get(row.repost_of_post_id as string);
    if (e) e.viewer_has_reposted = true;
  }
  return map;
}

async function fetchCommentsForPosts(
  postIds: string[]
): Promise<Map<string, PostCommentWithAuthor[]>> {
  const map = new Map<string, PostCommentWithAuthor[]>();
  if (!postIds.length) return map;
  const { data } = await supabase
    .from("post_comments")
    .select(COMMENT_SELECT)
    .in("post_id", postIds)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as PostComment[];
  const authors = await fetchAuthors(rows.map((r) => r.user_id));
  for (const row of rows) {
    const list = map.get(row.post_id) ?? [];
    list.push({
      ...row,
      author: authors.get(row.user_id) ?? {
        id: row.user_id,
        username: null,
        display_name: null,
        avatar_url: null,
      },
    });
    map.set(row.post_id, list);
  }
  return map;
}

function toPostWithAuthor(
  row: RawPostRow,
  authors: Map<string, PostAuthor>,
  books: Map<string, BookLite>,
  engagement: Map<string, Engagement>,
  repostById: Map<string, PostWithAuthor>,
  comments?: Map<string, PostCommentWithAuthor[]>
): PostWithAuthor {
  const e = engagement.get(row.id);
  return {
    id: row.id,
    user_id: row.user_id,
    body: row.body,
    image_url: row.image_url,
    book_id: row.book_id,
    repost_of_post_id: row.repost_of_post_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: authors.get(row.user_id) ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
    book: row.book_id ? books.get(row.book_id) ?? null : null,
    repost_of: row.repost_of_post_id ? repostById.get(row.repost_of_post_id) ?? null : null,
    like_count: e?.like_count ?? 0,
    comment_count: e?.comment_count ?? 0,
    viewer_has_liked: e?.viewer_has_liked ?? false,
    viewer_has_reposted: e?.viewer_has_reposted ?? false,
    comments: comments?.get(row.id),
  };
}

async function hydratePosts(
  rows: RawPostRow[],
  viewerId: string,
  includeComments = false
): Promise<PostWithAuthor[]> {
  if (!rows.length) return [];

  const authorIds = rows.map((r) => r.user_id);
  const bookIds = rows.map((r) => r.book_id).filter((id): id is string => Boolean(id));
  const postIds = rows.map((r) => r.id);
  const repostIds = [
    ...new Set(rows.map((r) => r.repost_of_post_id).filter((id): id is string => Boolean(id))),
  ];

  // Fetch quoted/reposted originals (one level deep), then hydrate them too.
  let repostById = new Map<string, PostWithAuthor>();
  if (repostIds.length) {
    const { data: originalRows } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .in("id", repostIds);
    const originals = (originalRows ?? []) as RawPostRow[];
    if (originals.length) {
      const oAuthors = await fetchAuthors(originals.map((r) => r.user_id));
      const oBooks = await fetchBooks(
        originals.map((r) => r.book_id).filter((id): id is string => Boolean(id))
      );
      const oEngagement = await fetchEngagement(
        originals.map((r) => r.id),
        viewerId
      );
      for (const o of originals) {
        repostById.set(
          o.id,
          toPostWithAuthor(o, oAuthors, oBooks, oEngagement, new Map())
        );
      }
    }
  }

  const [authors, books, engagement, comments] = await Promise.all([
    fetchAuthors([...authorIds, ...[...repostById.values()].map((p) => p.user_id)]),
    fetchBooks(bookIds),
    fetchEngagement(postIds, viewerId),
    includeComments ? fetchCommentsForPosts(postIds) : Promise.resolve(undefined),
  ]);

  return rows.map((row) =>
    toPostWithAuthor(row, authors, books, engagement, repostById, comments)
  );
}

async function notifyMentions(
  body: string,
  viewerId: string,
  actorDisplayName: string,
  linkUrl: string,
  postId: string,
  dedupContext: string
): Promise<void> {
  const usernames = extractMentionUsernames(body);
  if (!usernames.length) return;
  const { data: mentioned } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", usernames);
  for (const profile of mentioned ?? []) {
    if (profile.id === viewerId) continue;
    void createMentionNotification({
      recipientId: profile.id as string,
      actorId: viewerId,
      actorDisplayName,
      linkUrl,
      preview: body,
      dedupKey: `mention:${dedupContext}:${profile.id}`,
      postId,
    });
  }
}

export async function createPost(
  input: CreatePostInput
): Promise<{ post?: PostWithAuthor; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const body = trimBody(input.body);
  const imageUrl = input.imageUrl?.trim() || null;
  if (!body && !imageUrl) return { error: "Post cannot be empty." };

  if (body) {
    const gate = await requireModeration({ text: body, contentType: "FEED_POST" });
    if (gate.error) return { error: gate.error };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: viewerId,
      body,
      book_id: input.bookId ?? null,
      image_url: imageUrl,
      source_type: input.sourceType ?? null,
      source_id: input.sourceId ?? null,
    })
    .select(POST_SELECT)
    .single();
  if (error) {
    if (error.code === "23505" && input.sourceId) {
      return { error: "Already shared to your feed." };
    }
    return { error: error.message };
  }

  const row = data as RawPostRow;
  const actorName = await getActorDisplayName(viewerId);
  void notifyMentions(body, viewerId, actorName, postFeedPath(row.id), row.id, `post:${row.id}`);

  const [post] = await hydratePosts([row], viewerId);
  return { post };
}

export async function repostPost(
  postId: string,
  input: RepostInput = {}
): Promise<{ post?: PostWithAuthor; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", viewerId)
    .eq("repost_of_post_id", postId)
    .maybeSingle();
  if (existing?.id) return { error: "You already reposted this." };

  const body = trimBody(input.body ?? "");
  const imageUrl = input.imageUrl?.trim() || null;

  if (body) {
    const gate = await requireModeration({ text: body, contentType: "FEED_POST" });
    if (gate.error) return { error: gate.error };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: viewerId,
      body,
      image_url: imageUrl,
      book_id: input.bookId ?? null,
      repost_of_post_id: postId,
    })
    .select(POST_SELECT)
    .single();
  if (error) return { error: error.message };

  const row = data as RawPostRow;
  if (body) {
    const actorName = await getActorDisplayName(viewerId);
    void notifyMentions(body, viewerId, actorName, postFeedPath(row.id), row.id, `post:${row.id}`);
  }

  const [post] = await hydratePosts([row], viewerId);
  return { post };
}

export async function deletePost(postId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", viewerId);
  if (error) return { error: error.message };
  return {};
}

export async function listPostsByUser(
  profileUserId: string,
  viewerId: string,
  limit = 20
): Promise<PostWithAuthor[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", profileUserId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  const rows = (data ?? []) as RawPostRow[];
  if (!rows.length) return [];
  return hydratePosts(rows, viewerId);
}

export async function listFeedPosts(
  viewerId: string,
  followingIds: string[] | null,
  limit = 30
): Promise<PostWithAuthor[]> {
  // `following` tab restricts to followed authors; `for-you` relies on RLS
  // (own posts + followed authors + reposts) like web listFeedPosts.
  let authorIds: string[] | null = null;
  if (followingIds) {
    authorIds = [...new Set([viewerId, ...followingIds])];
    if (!authorIds.length) return [];
  }

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (authorIds) query = query.in("user_id", authorIds);

  const { data, error } = await query;
  if (error) return [];
  return hydratePosts((data ?? []) as RawPostRow[], viewerId);
}

export async function getPostById(
  postId: string,
  viewerId: string
): Promise<PostWithAuthor | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", postId)
    .maybeSingle();
  if (error || !data) return null;
  const [post] = await hydratePosts([data as RawPostRow], viewerId, true);
  return post ?? null;
}

// ---- Likes ------------------------------------------------------------------

export async function likePost(postId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Post not found." };

  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: viewerId });
  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }

  const actorName = await getActorDisplayName(viewerId);
  void createPostLikeNotification({
    recipientId: post.user_id as string,
    actorId: viewerId,
    actorDisplayName: actorName,
    postId,
  });
  return {};
}

export async function unlikePost(postId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", viewerId);
  if (error) return { error: error.message };
  return {};
}

// ---- Comments ---------------------------------------------------------------

export async function listPostComments(postId: string): Promise<PostCommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return [];
  const rows = (data ?? []) as PostComment[];
  const authors = await fetchAuthors(rows.map((r) => r.user_id));
  return rows.map((row) => ({
    ...row,
    author: authors.get(row.user_id) ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  }));
}

export async function addComment(
  postId: string,
  body: string,
  attachmentUrl?: string | null
): Promise<{ comment?: PostCommentWithAuthor; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const trimmed = trimBody(body);
  let attachment: string | null = null;
  if (attachmentUrl) {
    attachment = normalizeCommentAttachmentUrl(attachmentUrl);
    if (!attachment) {
      return { error: "Attachment must be a Giphy link or an uploaded image." };
    }
  }
  if (!trimmed && !attachment) return { error: "Comment cannot be empty." };

  if (trimmed) {
    const gate = await requireModeration({ text: trimmed, contentType: "COMMENT" });
    if (gate.error) return { error: gate.error };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Post not found." };

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: viewerId, body: trimmed, attachment_url: attachment })
    .select(COMMENT_SELECT)
    .single();
  if (error) return { error: error.message };

  const row = data as PostComment;
  const actorName = await getActorDisplayName(viewerId);
  void createPostCommentNotification({
    recipientId: post.user_id as string,
    actorId: viewerId,
    actorDisplayName: actorName,
    postId,
    commentId: row.id,
    preview: trimmed,
  });
  void notifyMentions(
    trimmed,
    viewerId,
    actorName,
    postFeedPath(postId),
    postId,
    `post_comment:${row.id}`
  );

  const authors = await fetchAuthors([viewerId]);
  return {
    comment: {
      ...row,
      author: authors.get(viewerId) ?? {
        id: viewerId,
        username: null,
        display_name: null,
        avatar_url: null,
      },
    },
  };
}

export async function updateComment(
  commentId: string,
  body: string
): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };
  const trimmed = trimBody(body);

  const { data: existing } = await supabase
    .from("post_comments")
    .select("attachment_url")
    .eq("id", commentId)
    .eq("user_id", viewerId)
    .maybeSingle();
  if (!existing) return { error: "Comment not found." };
  if (!trimmed && !existing.attachment_url) return { error: "Comment cannot be empty." };

  if (trimmed) {
    const gate = await requireModeration({
      text: trimmed,
      contentType: "COMMENT",
      contentId: commentId,
    });
    if (gate.error) return { error: gate.error };
  }

  const { error } = await supabase
    .from("post_comments")
    .update({ body: trimmed, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", viewerId);
  if (error) return { error: error.message };
  return {};
}

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };
  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", viewerId);
  if (error) return { error: error.message };
  return {};
}
