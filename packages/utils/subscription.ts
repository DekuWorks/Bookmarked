import type { PremiumFeature, SubscriptionStatus, SubscriptionTier } from "../types";

export type SubscriptionAccess = {
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
};

const PREMIUM_FEATURES: ReadonlySet<PremiumFeature> = new Set([
  "advanced_analytics",
  "ai_insights",
]);

function subscriptionIsActive(access: SubscriptionAccess): boolean {
  if (access.subscription_tier !== "premium") return false;
  if (!["active", "trialing"].includes(access.subscription_status)) return false;

  if (!access.subscription_expires_at) return true;

  const expiresAt = new Date(access.subscription_expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function canAccessFeature(
  feature: PremiumFeature | string,
  access: SubscriptionAccess | null | undefined
): boolean {
  if (!PREMIUM_FEATURES.has(feature as PremiumFeature)) {
    return true;
  }

  if (!access) return false;
  return subscriptionIsActive(access);
}

export function isPremiumSubscriber(
  access: SubscriptionAccess | null | undefined
): boolean {
  if (!access) return false;
  return subscriptionIsActive(access);
}
