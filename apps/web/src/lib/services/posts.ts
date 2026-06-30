import { createClient } from "@/lib/supabase/client";
import { postFeedPath } from "@/lib/routes/posts";
import { getFollowingIds } from "@/lib/services/follows";
import {
  createMentionNotification,
  createPostCommentNotification,
  createPostLikeNotification,
} from "@/lib/services/notifications";
import { extractMentionUsernames } from "@/lib/utils/mentions";
import type {
  Post,
  PostAuthor,
  PostComment,
  PostCommentWithAuthor,
  PostWithAuthor,
} from "@/types";

const POST_SELECT =
  "id, user_id, body, image_url, book_id, repost_of_post_id, created_at, updated_at";

const AUTHOR_SELECT = "id, username, display_name, avatar_url";

const POST_IMAGE_BUCKET = "post-images";
const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;
const POST_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type RawPostRow = Post;

type RawCommentRow = PostComment;

export type CreatePostInput = {
  body: string;
  bookId?: string | null;
  imageUrl?: string | null;
};

function trimBody(body: string): string {
  return body.trim();
}

async function getViewerId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function fetchAuthors(userIds: string[]): Promise<Map<string, PostAuthor>> {
  if (!userIds.length) return new Map();

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

async function fetchBooks(bookIds: string[]) {
  if (!bookIds.length) return new Map<string, NonNullable<PostWithAuthor["book"]>>();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, cover_url")
    .in("id", bookIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((book) => [
      book.id as string,
      {
        id: book.id as string,
        title: book.title as string,
        author: book.author as string | null,
        cover_url: book.cover_url as string | null,
      },
    ])
  );
}

async function fetchEngagement(
  postIds: string[],
  viewerId: string
): Promise<{
  likeCountByPost: Map<string, number>;
  commentCountByPost: Map<string, number>;
  likedSet: Set<string>;
  repostedSet: Set<string>;
}> {
  const likeCountByPost = new Map<string, number>();
  const commentCountByPost = new Map<string, number>();
  const likedSet = new Set<string>();
  const repostedSet = new Set<string>();

  if (!postIds.length) {
    return { likeCountByPost, commentCountByPost, likedSet, repostedSet };
  }

  const supabase = createClient();

  const [likesResult, commentsResult, viewerLikesResult, viewerRepostsResult] =
    await Promise.all([
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

  if (likesResult.error) throw likesResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (viewerLikesResult.error) throw viewerLikesResult.error;
  if (viewerRepostsResult.error) throw viewerRepostsResult.error;

  for (const row of likesResult.data ?? []) {
    const postId = row.post_id as string;
    likeCountByPost.set(postId, (likeCountByPost.get(postId) ?? 0) + 1);
  }

  for (const row of commentsResult.data ?? []) {
    const postId = row.post_id as string;
    commentCountByPost.set(postId, (commentCountByPost.get(postId) ?? 0) + 1);
  }

  for (const row of viewerLikesResult.data ?? []) {
    likedSet.add(row.post_id as string);
  }

  for (const row of viewerRepostsResult.data ?? []) {
    if (row.repost_of_post_id) {
      repostedSet.add(row.repost_of_post_id as string);
    }
  }

  return { likeCountByPost, commentCountByPost, likedSet, repostedSet };
}

async function hydratePosts(
  rows: RawPostRow[],
  viewerId: string,
  includeComments = false
): Promise<PostWithAuthor[]> {
  if (!rows.length) return [];

  const authorIds = [...new Set(rows.map((row) => row.user_id))];
  const bookIds = [
    ...new Set(rows.map((row) => row.book_id).filter((id): id is string => Boolean(id))),
  ];
  const repostIds = [
    ...new Set(
      rows
        .map((row) => row.repost_of_post_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const postIds = rows.map((row) => row.id);

  const [authors, books, engagement, repostRows] = await Promise.all([
    fetchAuthors(authorIds),
    fetchBooks(bookIds),
    fetchEngagement(postIds, viewerId),
    repostIds.length
      ? (async () => {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("posts")
            .select(POST_SELECT)
            .in("id", repostIds);
          if (error) throw error;
          return (data ?? []) as RawPostRow[];
        })()
      : Promise.resolve([]),
  ]);

  const repostAuthors = repostRows.length
    ? await fetchAuthors([...new Set(repostRows.map((row) => row.user_id))])
    : new Map<string, PostAuthor>();

  const repostBooks = repostRows.length
    ? await fetchBooks(
        [
          ...new Set(
            repostRows.map((row) => row.book_id).filter((id): id is string => Boolean(id))
          ),
        ]
      )
    : new Map<string, NonNullable<PostWithAuthor["book"]>>();

  const repostEngagement = repostRows.length
    ? await fetchEngagement(
        repostRows.map((row) => row.id),
        viewerId
      )
    : {
        likeCountByPost: new Map<string, number>(),
        commentCountByPost: new Map<string, number>(),
        likedSet: new Set<string>(),
        repostedSet: new Set<string>(),
      };

  const repostById = new Map<string, PostWithAuthor>(
    repostRows.map((row) => [
      row.id,
      {
        ...row,
        author: repostAuthors.get(row.user_id) ?? {
          id: row.user_id,
          username: null,
          display_name: null,
          avatar_url: null,
        },
        like_count: repostEngagement.likeCountByPost.get(row.id) ?? 0,
        comment_count: repostEngagement.commentCountByPost.get(row.id) ?? 0,
        viewer_has_liked: repostEngagement.likedSet.has(row.id),
        viewer_has_reposted: repostEngagement.repostedSet.has(row.id),
        book: row.book_id ? repostBooks.get(row.book_id) ?? null : null,
        repost_of: null,
      },
    ])
  );

  let commentsByPost = new Map<string, PostCommentWithAuthor[]>();

  if (includeComments) {
    commentsByPost = await fetchCommentsForPosts(postIds);
  }

  return rows.map((row) => ({
    ...row,
    author: authors.get(row.user_id) ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
    like_count: engagement.likeCountByPost.get(row.id) ?? 0,
    comment_count: engagement.commentCountByPost.get(row.id) ?? 0,
    viewer_has_liked: engagement.likedSet.has(row.id),
    viewer_has_reposted: engagement.repostedSet.has(row.id),
    book: row.book_id ? books.get(row.book_id) ?? null : null,
    repost_of: row.repost_of_post_id
      ? repostById.get(row.repost_of_post_id) ?? null
      : null,
    comments: includeComments ? commentsByPost.get(row.id) ?? [] : undefined,
  }));
}

async function fetchCommentsForPosts(
  postIds: string[]
): Promise<Map<string, PostCommentWithAuthor[]>> {
  const map = new Map<string, PostCommentWithAuthor[]>();
  if (!postIds.length) return map;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, post_id, user_id, body, created_at, updated_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as RawCommentRow[];
  const authorIds = [...new Set(rows.map((row) => row.user_id))];
  const authors = await fetchAuthors(authorIds);

  for (const row of rows) {
    const comment: PostCommentWithAuthor = {
      ...row,
      author: authors.get(row.user_id) ?? {
        id: row.user_id,
        username: null,
        display_name: null,
        avatar_url: null,
      },
    };
    const existing = map.get(row.post_id) ?? [];
    existing.push(comment);
    map.set(row.post_id, existing);
  }

  return map;
}

function scoreForYouPost(
  post: RawPostRow,
  viewerId: string,
  followingSet: Set<string>
): number {
  let score = 0;
  const ageHours =
    (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 48 - ageHours);

  if (followingSet.has(post.user_id)) score += 12;
  if (post.user_id === viewerId) score -= 20;
  if (post.repost_of_post_id) score += 2;

  return score;
}

export function validatePostImageFile(file: File): string | null {
  if (!POST_IMAGE_TYPES.has(file.type)) {
    return "Please choose a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_POST_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

function postImageExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function uploadPostImage(
  file: File
): Promise<{ url?: string; error?: string }> {
  const validationError = validatePostImageFile(file);
  if (validationError) return { error: validationError };

  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const fileId = crypto.randomUUID();
  const path = `${viewerId}/${fileId}.${postImageExtension(file.type)}`;

  const { error: uploadError } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function createPost(input: CreatePostInput): Promise<{ post?: PostWithAuthor; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const body = trimBody(input.body);
  const imageUrl = input.imageUrl?.trim() || null;
  if (!body && !imageUrl) return { error: "Post cannot be empty." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: viewerId,
      body,
      book_id: input.bookId ?? null,
      image_url: imageUrl,
    })
    .select(POST_SELECT)
    .single();

  if (error) return { error: error.message };

  const postId = (data as RawPostRow).id;

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", viewerId)
    .maybeSingle();

  const actorDisplayName =
    actorProfile?.display_name?.trim() ||
    actorProfile?.username?.trim() ||
    "A reader";

  const mentionUsernames = extractMentionUsernames(body);
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
        linkUrl: postFeedPath(postId),
        preview: body,
        dedupKey: `mention:post:${postId}:${profile.id}`,
      });
    }
  }

  const [post] = await hydratePosts([data as RawPostRow], viewerId);
  return { post };
}

export async function listFeedPosts(
  viewerId: string,
  mode: "following" | "for-you",
  limit = 30
): Promise<PostWithAuthor[]> {
  const followingIds = await getFollowingIds(viewerId);
  const authorIds = [...new Set([viewerId, ...followingIds])];

  if (!authorIds.length) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("user_id", authorIds)
    .order("created_at", { ascending: false })
    .limit(mode === "for-you" ? limit * 2 : limit);

  if (error) throw error;

  const rows = (data ?? []) as RawPostRow[];
  if (!rows.length) return [];

  if (mode === "following") {
    return hydratePosts(rows.slice(0, limit), viewerId);
  }

  const followingSet = new Set(followingIds);
  const ranked = rows
    .map((row) => ({
      row,
      score: scoreForYouPost(row, viewerId, followingSet),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || b.row.created_at.localeCompare(a.row.created_at)
    )
    .slice(0, limit)
    .map(({ row }) => row);

  return hydratePosts(ranked, viewerId);
}

export async function getPostById(
  postId: string,
  viewerId: string
): Promise<PostWithAuthor | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", postId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [post] = await hydratePosts([data as RawPostRow], viewerId, true);
  return post ?? null;
}

export async function likePost(postId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .maybeSingle();

  if (postError) return { error: postError.message };
  if (!post) return { error: "Post not found." };

  const { error } = await supabase.from("post_likes").insert({
    post_id: postId,
    user_id: viewerId,
  });

  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", viewerId)
    .maybeSingle();

  void createPostLikeNotification({
    recipientId: post.user_id as string,
    actorId: viewerId,
    actorDisplayName:
      actorProfile?.display_name?.trim() ||
      actorProfile?.username?.trim() ||
      "A reader",
    postId,
  });

  return {};
}

export async function unlikePost(postId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", viewerId);

  if (error) return { error: error.message };
  return {};
}

export async function addComment(
  postId: string,
  body: string
): Promise<{ comment?: PostCommentWithAuthor; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const trimmed = trimBody(body);
  if (!trimmed) return { error: "Comment cannot be empty." };

  const supabase = createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .maybeSingle();

  if (postError) return { error: postError.message };
  if (!post) return { error: "Post not found." };

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: viewerId,
      body: trimmed,
    })
    .select("id, post_id, user_id, body, created_at, updated_at")
    .single();

  if (error) return { error: error.message };

  const authors = await fetchAuthors([viewerId]);
  const comment: PostCommentWithAuthor = {
    ...(data as RawCommentRow),
    author: authors.get(viewerId) ?? {
      id: viewerId,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  };

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", viewerId)
    .maybeSingle();

  void createPostCommentNotification({
    recipientId: post.user_id as string,
    actorId: viewerId,
    actorDisplayName:
      actorProfile?.display_name?.trim() ||
      actorProfile?.username?.trim() ||
      "A reader",
    postId,
    commentId: (data as RawCommentRow).id,
    preview: trimmed,
  });

  return { comment };
}

export async function updateComment(
  commentId: string,
  body: string
): Promise<{ comment?: PostCommentWithAuthor; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const trimmed = trimBody(body);
  if (!trimmed) return { error: "Comment cannot be empty." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .update({ body: trimmed })
    .eq("id", commentId)
    .eq("user_id", viewerId)
    .select("id, post_id, user_id, body, created_at, updated_at")
    .single();

  if (error) return { error: error.message };

  const authors = await fetchAuthors([viewerId]);
  return {
    comment: {
      ...(data as RawCommentRow),
      author: authors.get(viewerId) ?? {
        id: viewerId,
        username: null,
        display_name: null,
        avatar_url: null,
      },
    },
  };
}

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", viewerId);

  if (error) return { error: error.message };
  return {};
}

export async function repostPost(postId: string): Promise<{ post?: PostWithAuthor; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", viewerId)
    .eq("repost_of_post_id", postId)
    .maybeSingle();

  if (existing?.id) return { error: "You already reposted this." };

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: viewerId,
      body: "",
      repost_of_post_id: postId,
    })
    .select(POST_SELECT)
    .single();

  if (error) return { error: error.message };

  const [post] = await hydratePosts([data as RawPostRow], viewerId);
  return { post };
}

export async function deletePost(postId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", viewerId);

  if (error) return { error: error.message };
  return {};
}

export { postFeedPath };
