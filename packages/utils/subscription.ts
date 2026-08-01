import type { PremiumFeature, SubscriptionStatus, SubscriptionTier } from "../types";

export type SubscriptionAccess = {
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
};

export const MEMBERSHIP_FEATURES = {
  free: [
    "tracker",
    "library",
    "goals",
    "feed",
    "reviews",
    "custom_shelf",
    "basic_ai",
    "stats",
    "reading_dna_traits",
  ],
  plus: [
    "reading_insights",
    "reading_speed",
    "mood_analytics",
    "heatmaps",
    "ai_companion",
    "quote_vault",
    "unlimited_quotes",
    "unlimited_clubs",
    "unlimited_challenges",
    "reading_dna_dashboard",
    "reading_dna_ai_insights",
    "book_matches",
    // Compatibility aliases for the existing feature gates.
    "advanced_analytics",
    "ai_insights",
  ],
  home: [
    "book_map",
    "reader_map",
    "reading_dna_match",
    "premium_events",
    "concierge",
    "priority_support",
  ],
} as const satisfies Record<SubscriptionTier, readonly PremiumFeature[]>;

const FREE_FEATURES = new Set<PremiumFeature>(MEMBERSHIP_FEATURES.free);
const PLUS_FEATURES = new Set<PremiumFeature>(MEMBERSHIP_FEATURES.plus);
const HOME_FEATURES = new Set<PremiumFeature>(MEMBERSHIP_FEATURES.home);

function subscriptionIsActive(access: SubscriptionAccess): boolean {
  if (access.subscription_tier === "free") return false;
  if (!["active", "trialing"].includes(access.subscription_status)) return false;

  if (!access.subscription_expires_at) return true;

  const expiresAt = new Date(access.subscription_expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function canAccessFeature(
  feature: PremiumFeature | string,
  access: SubscriptionAccess | null | undefined
): boolean {
  const membershipFeature = feature as PremiumFeature;
  if (!FREE_FEATURES.has(membershipFeature) && !PLUS_FEATURES.has(membershipFeature) && !HOME_FEATURES.has(membershipFeature)) {
    return true;
  }

  if (FREE_FEATURES.has(membershipFeature)) return true;
  if (!access || !subscriptionIsActive(access)) return false;
  if (PLUS_FEATURES.has(membershipFeature)) return true;
  return access.subscription_tier === "home";
}

export function isPremiumSubscriber(
  access: SubscriptionAccess | null | undefined
): boolean {
  if (!access) return false;
  return subscriptionIsActive(access);
}
