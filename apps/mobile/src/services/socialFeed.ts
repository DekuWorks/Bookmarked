import { supabase } from "./supabase";
import { getFollowingIds } from "./follows";
import { getBlockedUserIds } from "./moderation";
import { listFeedPosts } from "./posts";
import type { PostWithAuthor } from "../types";

/**
 * Unified home feed for mobile, matching the mockup (IMG_5360): interleaves
 * public **reviews** (rich rating/feelings/spoiler cards), text **posts**
 * (composer), and public club **discussions**. Tabs:
 *  - "for-you": everything public, newest first
 *  - "following": only from readers the viewer follows
 *  - "clubs": club discussions only
 * All hydration uses batched `.in()` lookups to respect RLS.
 */

export type FeedTab = "for-you" | "following" | "clubs";

export type FeedAuthor = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
};

export type FeedBook = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
};

export type ReviewEntry = {
  kind: "review";
  id: string;
  createdAt: string;
  author: FeedAuthor;
  book: FeedBook | null;
  rating: number | null;
  ratingEmoji: string | null;
  reviewBody: string | null;
  hasSpoilers: boolean;
  feelings: string[];
  likeCount: number;
  viewerLiked: boolean;
};

export type PostEntry = {
  kind: "post";
  id: string;
  createdAt: string;
  author: FeedAuthor;
  /** Full hydrated post (attachments, repost/quote embed, engagement counts). */
  post: PostWithAuthor;
};

export type DiscussionEntry = {
  kind: "discussion";
  id: string;
  createdAt: string;
  author: FeedAuthor;
  book: FeedBook | null;
  clubId: string;
  clubName: string;
  body: string;
  containsSpoilers: boolean;
  participantCount: number;
  participantAvatars: (string | null)[];
};

export type FeedEntry = ReviewEntry | PostEntry | DiscussionEntry;

type ProfileLite = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function toAuthor(id: string, profiles: Map<string, ProfileLite>): FeedAuthor {
  const p = profiles.get(id);
  return {
    id,
    name: p?.display_name?.trim() || p?.username?.trim() || "Reader",
    username: p?.username ?? null,
    avatarUrl: p?.avatar_url ?? null,
  };
}

async function fetchProfiles(ids: string[]): Promise<Map<string, ProfileLite>> {
  const map = new Map<string, ProfileLite>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", unique);
  for (const p of data ?? []) map.set(p.id as string, p as ProfileLite);
  return map;
}

async function fetchBooks(ids: string[]): Promise<Map<string, FeedBook>> {
  const map = new Map<string, FeedBook>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return map;
  const { data } = await supabase
    .from("books")
    .select("id, title, author, cover_url")
    .in("id", unique);
  for (const b of data ?? []) {
    map.set(b.id as string, {
      id: b.id as string,
      title: b.title as string,
      author: b.author as string | null,
      coverUrl: b.cover_url as string | null,
    });
  }
  return map;
}

type ReviewRow = {
  id: string;
  user_id: string;
  book_id: string;
  rating: number | null;
  rating_emoji: string | null;
  review_body: string | null;
  has_spoilers: boolean;
  feelings: string[] | null;
  created_at: string;
};

type DiscussionRow = {
  id: string;
  club_id: string;
  user_id: string;
  book_id?: string | null;
  related_book_id?: string | null;
  body: string;
  contains_spoilers?: boolean;
  created_at: string;
};

async function reactionCounts(
  reviewIds: string[],
  viewerId: string
): Promise<Map<string, { count: number; viewerLiked: boolean }>> {
  const map = new Map<string, { count: number; viewerLiked: boolean }>();
  if (!reviewIds.length) return map;
  for (const id of reviewIds) map.set(id, { count: 0, viewerLiked: false });

  const { data } = await supabase
    .from("review_reactions")
    .select("review_id, user_id, reaction")
    .in("review_id", reviewIds)
    .eq("reaction", "like");

  for (const row of data ?? []) {
    const entry = map.get(row.review_id as string);
    if (!entry) continue;
    entry.count += 1;
    if (row.user_id === viewerId) entry.viewerLiked = true;
  }
  return map;
}

async function loadReviews(
  viewerId: string,
  followingIds: string[] | null,
  limit: number
): Promise<ReviewEntry[]> {
  let query = supabase
    .from("reviews")
    .select(
      "id, user_id, book_id, rating, rating_emoji, review_body, has_spoilers, feelings, created_at"
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (followingIds) {
    if (!followingIds.length) return [];
    query = query.in("user_id", followingIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as ReviewRow[];
  if (!rows.length) return [];

  const [profiles, books, reactions] = await Promise.all([
    fetchProfiles(rows.map((r) => r.user_id)),
    fetchBooks(rows.map((r) => r.book_id)),
    reactionCounts(rows.map((r) => r.id), viewerId),
  ]);

  return rows.map((row) => {
    const reaction = reactions.get(row.id);
    return {
      kind: "review" as const,
      id: row.id,
      createdAt: row.created_at,
      author: toAuthor(row.user_id, profiles),
      book: books.get(row.book_id) ?? null,
      rating: row.rating,
      ratingEmoji: row.rating_emoji,
      reviewBody: row.review_body,
      hasSpoilers: row.has_spoilers,
      feelings: row.feelings ?? [],
      likeCount: reaction?.count ?? 0,
      viewerLiked: reaction?.viewerLiked ?? false,
    };
  });
}

async function loadPosts(
  viewerId: string,
  followingIds: string[] | null,
  limit: number
): Promise<PostEntry[]> {
  const posts = await listFeedPosts(viewerId, followingIds, limit);
  return posts.map((post) => ({
    kind: "post" as const,
    id: post.id,
    createdAt: post.created_at,
    author: {
      id: post.author.id,
      name: post.author.display_name?.trim() || post.author.username?.trim() || "Reader",
      username: post.author.username,
      avatarUrl: post.author.avatar_url,
    },
    post,
  }));
}

async function loadDiscussions(
  followingIds: string[] | null,
  limit: number
): Promise<DiscussionEntry[]> {
  // Restrict to public clubs so private discussions never surface.
  const { data: publicClubs } = await supabase
    .from("book_clubs")
    .select("id, name")
    .eq("visibility", "public");

  const clubNameById = new Map<string, string>();
  for (const c of publicClubs ?? []) clubNameById.set(c.id as string, c.name as string);
  const publicClubIds = [...clubNameById.keys()];
  if (!publicClubIds.length) return [];

  let query = supabase
    .from("book_club_discussions")
    .select("id, club_id, user_id, related_book_id, book_id, body, contains_spoilers, created_at")
    .in("club_id", publicClubIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (followingIds) {
    if (!followingIds.length) return [];
    query = query.in("user_id", followingIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as DiscussionRow[];
  if (!rows.length) return [];

  const clubIds = [...new Set(rows.map((r) => r.club_id))];
  const { data: memberRows } = await supabase
    .from("book_club_members")
    .select("club_id, user_id")
    .in("club_id", clubIds);

  const membersByClub = new Map<string, string[]>();
  for (const m of memberRows ?? []) {
    const list = membersByClub.get(m.club_id as string) ?? [];
    list.push(m.user_id as string);
    membersByClub.set(m.club_id as string, list);
  }

  const [profiles, books] = await Promise.all([
    fetchProfiles([
      ...rows.map((r) => r.user_id),
      ...(memberRows ?? []).map((m) => m.user_id as string),
    ]),
    fetchBooks(
      rows
        .map((r) => r.related_book_id ?? r.book_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]);

  return rows.map((row) => {
    const members = membersByClub.get(row.club_id) ?? [];
    return {
      kind: "discussion" as const,
      id: row.id,
      createdAt: row.created_at,
      author: toAuthor(row.user_id, profiles),
      book: (row.related_book_id ?? row.book_id)
        ? books.get((row.related_book_id ?? row.book_id) as string) ?? null
        : null,
      clubId: row.club_id,
      clubName: clubNameById.get(row.club_id) ?? "Book club",
      body: row.body,
      containsSpoilers: Boolean(row.contains_spoilers),
      participantCount: members.length,
      participantAvatars: members
        .slice(0, 3)
        .map((id) => profiles.get(id)?.avatar_url ?? null),
    };
  });
}

export async function fetchHomeFeed(
  viewerId: string,
  tab: FeedTab,
  limit = 30
): Promise<FeedEntry[]> {
  const blockedIds = new Set(await getBlockedUserIds());

  if (tab === "clubs") {
    return loadDiscussions(null, limit).then((entries) =>
      entries.filter((entry) => !blockedIds.has(entry.author.id))
    );
  }

  const followingIds = tab === "following" ? await getFollowingIds(viewerId) : null;

  const [reviews, posts, discussions] = await Promise.all([
    loadReviews(viewerId, followingIds, limit),
    loadPosts(viewerId, followingIds, limit),
    loadDiscussions(followingIds, limit),
  ]);

  return [...reviews, ...posts, ...discussions]
    .filter((entry) => !blockedIds.has(entry.author.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
