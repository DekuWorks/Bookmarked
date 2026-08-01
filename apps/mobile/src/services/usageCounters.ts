import { supabase } from "./supabase";
import {
  USAGE_COUNTER_KEYS,
  periodKeyForCounter,
  type UsageCounterKey,
} from "../../../../packages/utils/usageCounters";
import {
  ENTITLEMENT_LIMIT_MESSAGES,
  canCreateQuoteGraphic,
  getEntitlements,
  toSubscriptionAccessFromRow,
} from "../utils/subscription";

export type UsageSnapshot = {
  count: number;
  limit: number;
  remaining: number;
  periodKey: string;
};

async function loadAccess(userId: string) {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("subscription_tier, subscription_status, subscription_expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  return toSubscriptionAccessFromRow(data);
}

export async function getUsageSnapshot(
  userId: string,
  counterKey: UsageCounterKey
): Promise<UsageSnapshot> {
  const access = await loadAccess(userId);
  const entitlements = getEntitlements(access);
  const periodKey = periodKeyForCounter(counterKey);
  const limit =
    counterKey === USAGE_COUNTER_KEYS.quoteGraphics
      ? entitlements.quoteGraphicsPerMonth
      : entitlements.readingChallengesPerYear;

  const { data, error } = await supabase.rpc("get_usage_count", {
    p_counter_key: counterKey,
    p_period_key: periodKey,
  });

  if (error) {
    console.warn("[usageCounters] get_usage_count failed:", error.message);
  }

  const count = typeof data === "number" ? data : 0;
  const finiteLimit = Number.isFinite(limit) ? limit : Number.MAX_SAFE_INTEGER;

  return {
    count,
    limit: finiteLimit,
    remaining: Math.max(finiteLimit - count, 0),
    periodKey,
  };
}

export async function consumeQuoteGraphicSlot(
  userId: string
): Promise<{ ok: true; remaining: number } | { ok: false; error: string }> {
  const access = await loadAccess(userId);
  const entitlements = getEntitlements(access);
  const periodKey = periodKeyForCounter(USAGE_COUNTER_KEYS.quoteGraphics);
  const limit = entitlements.quoteGraphicsPerMonth;

  if (Number.isFinite(limit)) {
    const snapshot = await getUsageSnapshot(userId, USAGE_COUNTER_KEYS.quoteGraphics);
    if (!canCreateQuoteGraphic(snapshot.count, access)) {
      return { ok: false, error: ENTITLEMENT_LIMIT_MESSAGES.quote_graphics };
    }
  }

  const rpcLimit = Number.isFinite(limit) ? limit : 1_000_000;
  const { data, error } = await supabase.rpc("try_increment_usage_counter", {
    p_counter_key: USAGE_COUNTER_KEYS.quoteGraphics,
    p_period_key: periodKey,
    p_limit: rpcLimit,
  });

  if (error) return { ok: false, error: error.message };

  const result = data as { ok?: boolean; remaining?: number } | null;
  if (!result?.ok) {
    return { ok: false, error: ENTITLEMENT_LIMIT_MESSAGES.quote_graphics };
  }

  return { ok: true, remaining: result.remaining ?? 0 };
}

export async function getQuoteGraphicsRemaining(userId: string): Promise<number> {
  const snapshot = await getUsageSnapshot(userId, USAGE_COUNTER_KEYS.quoteGraphics);
  return snapshot.remaining;
}

export { USAGE_COUNTER_KEYS };
