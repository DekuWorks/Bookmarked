import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CHALLENGE_BADGE_DEFINITIONS,
  evaluateChallengeBadges,
  type ChallengeBadgeKey,
} from "../../../../../packages/utils/challengeBadges";
import { collectStreakDateKeys, computeReadingStreak } from "../../../../../packages/utils/readingStreak";
import type { ChallengeBadgeAward } from "../../../../../packages/utils/challengeTypes";

export async function evaluateAndAwardBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<ChallengeBadgeAward[]> {
  const [{ data: awarded }, { count: completedCount }, { count: finishedCount }, { data: sessions }] =
    await Promise.all([
      supabase.from("user_badges").select("badge_key").eq("user_id", userId),
      supabase
        .from("reading_challenge_members")
        .select("challenge_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),
      supabase
        .from("user_books")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("shelf_status", "read")
        .eq("dnf", false),
      supabase
        .from("reading_sessions")
        .select("session_date, created_at, activity_kind, pages_read, listening_seconds")
        .eq("user_id", userId)
        .limit(400),
    ]);

  const already = (awarded ?? []).map((row) => row.badge_key as string);
  const dates = collectStreakDateKeys(
    (sessions ?? []).map((row) => ({
      session_date: row.session_date as string | null,
      created_at: row.created_at as string | null,
      activity_kind: row.activity_kind as string | null,
      pages_read: row.pages_read as number | null,
      listening_seconds: row.listening_seconds as number | null,
    }))
  );
  const streak = computeReadingStreak(dates);

  const keys = evaluateChallengeBadges({
    completedChallengeCount: completedCount ?? 0,
    readingStreakDays: streak.current,
    finishedBookCount: finishedCount ?? 0,
    alreadyAwarded: already,
  });

  const awardedNow: ChallengeBadgeAward[] = [];
  for (const key of keys) {
    const { data } = await supabase.rpc("award_user_badge", { p_badge_key: key });
    if (data === true) {
      awardedNow.push({
        badgeKey: key,
        title: CHALLENGE_BADGE_DEFINITIONS[key as ChallengeBadgeKey].title,
        description: CHALLENGE_BADGE_DEFINITIONS[key as ChallengeBadgeKey].description,
      });
    }
  }
  return awardedNow;
}

export async function listUserBadges(userId: string, featuredOnly = false) {
  const { supabase } = await import("../supabase");
  let query = supabase
    .from("user_badges")
    .select("id, badge_key, featured, awarded_at, challenge_badge_definitions(title, description)")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });
  if (featuredOnly) query = query.eq("featured", true);
  const { data, error } = await query;
  if (error) {
    console.warn("[ChallengeBadgeService] list failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const def = row.challenge_badge_definitions as
      | { title?: string; description?: string }
      | { title?: string; description?: string }[]
      | null;
    const info = Array.isArray(def) ? def[0] : def;
    return {
      id: row.id as string,
      badgeKey: row.badge_key as string,
      title: info?.title ?? (row.badge_key as string),
      description: info?.description ?? "",
      featured: Boolean(row.featured),
      awardedAt: row.awarded_at as string,
    };
  });
}

export async function setBadgeFeatured(
  badgeId: string,
  featured: boolean
): Promise<{ error?: string }> {
  const { supabase } = await import("../supabase");
  const { error } = await supabase.from("user_badges").update({ featured }).eq("id", badgeId);
  return error ? { error: error.message } : {};
}
