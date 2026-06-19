import { createClient } from "@/lib/supabase/client";

export type FollowCounts = {
  followers: number;
  following: number;
};

export type FollowListKind = "followers" | "following";

export type FollowListUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  isMutual: boolean;
  viewerFollows: boolean;
  followsViewer: boolean;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

async function getViewerFollowSets(viewerId: string): Promise<{
  following: Set<string>;
  followers: Set<string>;
}> {
  const supabase = createClient();
  const [followingResult, followersResult] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", viewerId),
    supabase.from("follows").select("follower_id").eq("following_id", viewerId),
  ]);

  return {
    following: new Set((followingResult.data ?? []).map((row) => row.following_id)),
    followers: new Set((followersResult.data ?? []).map((row) => row.follower_id)),
  };
}

function enrichFollowUsers(
  profiles: ProfileRow[],
  viewerSets: { following: Set<string>; followers: Set<string> }
): FollowListUser[] {
  return profiles
    .map((profile) => {
      const viewerFollows = viewerSets.following.has(profile.id);
      const followsViewer = viewerSets.followers.has(profile.id);

      return {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        viewerFollows,
        followsViewer,
        isMutual: viewerFollows && followsViewer,
      };
    })
    .sort((a, b) => {
      if (a.isMutual !== b.isMutual) return a.isMutual ? -1 : 1;
      const aName = a.display_name?.trim() || a.username?.trim() || "";
      const bName = b.display_name?.trim() || b.username?.trim() || "";
      return aName.localeCompare(bName, undefined, { sensitivity: "base" });
    });
}

export async function getFollowList(
  profileUserId: string,
  viewerId: string,
  kind: FollowListKind
): Promise<FollowListUser[]> {
  const supabase = createClient();

  if (kind === "followers") {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", profileUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const userIds = (data ?? []).map((row) => row.follower_id);
    if (!userIds.length) return [];

    const [profilesResult, viewerSets] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio")
        .in("id", userIds),
      getViewerFollowSets(viewerId),
    ]);

    if (profilesResult.error) throw profilesResult.error;

    const profilesById = new Map(
      ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
    );

    const orderedProfiles = userIds
      .map((id) => profilesById.get(id))
      .filter((profile): profile is ProfileRow => Boolean(profile));

    return enrichFollowUsers(orderedProfiles, viewerSets);
  }

  const { data, error } = await supabase
    .from("follows")
    .select("following_id, created_at")
    .eq("follower_id", profileUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const userIds = (data ?? []).map((row) => row.following_id);

  if (!userIds.length) return [];

  const [profilesResult, viewerSets] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio")
      .in("id", userIds),
    getViewerFollowSets(viewerId),
  ]);

  if (profilesResult.error) throw profilesResult.error;

  const profilesById = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  );

  const orderedProfiles = userIds
    .map((id) => profilesById.get(id))
    .filter((profile): profile is ProfileRow => Boolean(profile));

  return enrichFollowUsers(orderedProfiles, viewerSets);
}

/** Users both the viewer and profile owner follow. */
export async function getSharedFollowing(
  profileUserId: string,
  viewerId: string
): Promise<FollowListUser[]> {
  if (profileUserId === viewerId) return [];

  const [viewerFollowing, profileFollowing, viewerSets] = await Promise.all([
    getFollowingIds(viewerId),
    getFollowingIds(profileUserId),
    getViewerFollowSets(viewerId),
  ]);

  const profileFollowingSet = new Set(profileFollowing);
  const sharedIds = viewerFollowing.filter((id) => profileFollowingSet.has(id));

  if (!sharedIds.length) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .in("id", sharedIds);

  if (error) throw error;

  return enrichFollowUsers((data ?? []) as ProfileRow[], viewerSets);
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  return (data ?? []).map((row) => row.following_id);
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (followerId === followingId) return false;

  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  return Boolean(data?.id);
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const supabase = createClient();

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };
  if (user.id === followingId) return { error: "You cannot follow yourself." };

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: followingId,
  });

  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }

  return {};
}

export async function unfollowUser(followingId: string): Promise<{ error?: string }> {
  const supabase = createClient();
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
