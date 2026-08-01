import { createClient } from "@/lib/supabase/client";
import {
  USAGE_COUNTER_KEYS,
  periodKeyForCounter,
} from "@bookmarked/utils/usageCounters";
import {
  ENTITLEMENT_LIMIT_MESSAGES,
  canJoinReadingChallenge,
  getEntitlements,
  toSubscriptionAccessFromRow,
} from "@/lib/utils/subscription";

/**
 * Free rule: max 3 reading challenge joins per calendar year
 * (`ENTITLEMENTS.free.readingChallengesPerYear`).
 * Count = rows in `reading_challenge_members` for challenges whose `year`
 * matches the current UTC year, plus `usage_counters` for the year period.
 * Existing memberships are preserved on downgrade; only new joins are blocked.
 */

export type ReadingChallenge = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  year: number;
  is_active: boolean;
};

export async function listActiveChallenges(): Promise<ReadingChallenge[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reading_challenges")
    .select("id, slug, title, description, year, is_active")
    .eq("is_active", true)
    .order("year", { ascending: false });

  if (error) {
    console.warn("[readingChallenges] list failed:", error.message);
    return [];
  }
  return (data ?? []) as ReadingChallenge[];
}

export async function joinReadingChallenge(
  challengeId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("reading_challenge_members")
    .select("challenge_id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return {};

  const year = new Date().getUTCFullYear();
  const [{ count, error: countError }, { data: subscription }] = await Promise.all([
    supabase
      .from("reading_challenge_members")
      .select("challenge_id, reading_challenges!inner(year)", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("reading_challenges.year", year),
    supabase
      .from("user_subscriptions")
      .select("subscription_tier, subscription_status, subscription_expires_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (countError) {
    // Fallback if join filter unsupported: count all memberships this year via usage counter only.
    console.warn("[readingChallenges] count query:", countError.message);
  }

  const access = toSubscriptionAccessFromRow(subscription);
  const joinedThisYear = count ?? 0;

  if (!canJoinReadingChallenge(joinedThisYear, access)) {
    return { error: ENTITLEMENT_LIMIT_MESSAGES.reading_challenges };
  }

  const entitlements = getEntitlements(access);
  const limit = entitlements.readingChallengesPerYear;
  const periodKey = periodKeyForCounter(USAGE_COUNTER_KEYS.readingChallenges);
  const rpcLimit = Number.isFinite(limit) ? limit : 1_000_000;

  const { data: usageResult, error: usageError } = await supabase.rpc(
    "try_increment_usage_counter",
    {
      p_counter_key: USAGE_COUNTER_KEYS.readingChallenges,
      p_period_key: periodKey,
      p_limit: rpcLimit,
    }
  );

  if (usageError) return { error: usageError.message };
  const usage = usageResult as { ok?: boolean } | null;
  if (!usage?.ok) {
    return { error: ENTITLEMENT_LIMIT_MESSAGES.reading_challenges };
  }

  const { error } = await supabase.from("reading_challenge_members").insert({
    challenge_id: challengeId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }

  return {};
}
