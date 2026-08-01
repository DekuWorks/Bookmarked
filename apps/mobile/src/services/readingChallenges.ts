import { supabase } from "./supabase";
import {
  USAGE_COUNTER_KEYS,
  periodKeyForCounter,
} from "../../../../packages/utils/usageCounters";
import {
  ENTITLEMENT_LIMIT_MESSAGES,
  canJoinReadingChallenge,
  getEntitlements,
  toSubscriptionAccessFromRow,
} from "../utils/subscription";

/**
 * Free rule: max 3 reading challenge joins per calendar year.
 * Preserve existing memberships on downgrade; block new joins over the cap.
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
    console.warn("[readingChallenges] count query:", countError.message);
  }

  const access = toSubscriptionAccessFromRow(subscription);
  if (!canJoinReadingChallenge(count ?? 0, access)) {
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
  if (!(usageResult as { ok?: boolean } | null)?.ok) {
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
