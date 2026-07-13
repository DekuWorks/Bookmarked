import { supabase } from "./supabase";

/**
 * Mobile follows service. Mirrors apps/web/src/lib/services/follows.ts against
 * the `follows` table + RLS.
 */

export type FollowCounts = { followers: number; following: number };

export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  return (data ?? []).map((row) => row.following_id as string);
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (followerId === followingId) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);
  return {
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
  };
}

export async function followUser(followingId: string): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (user.id === followingId) return { error: "You cannot follow yourself." };

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: followingId });

  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }
  return {};
}

export async function unfollowUser(followingId: string): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return { error: error.message };
  return {};
}
