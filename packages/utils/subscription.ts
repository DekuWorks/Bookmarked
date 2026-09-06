import type {
  FeatureKey,
  PremiumFeature,
  SubscriptionStatus,
  SubscriptionTier,
} from "../types";

export type SubscriptionAccess = {
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
};

export type ReadingDnaAccess = "top_three" | "full" | "advanced";

export type TierEntitlements = {
  customShelves: number;
  savedQuotes: number;
  quoteGraphicsPerMonth: number;
  joinedBookClubs: number;
  readingChallengesPerYear: number;
  advancedReadingInsights: boolean;
  monthlyWrapped: boolean;
  aiReadingCompanion: boolean;
  quoteScanner: boolean;
  advancedReviews: boolean;
  clubPolls: boolean;
  clubAnalytics: boolean;
  readingDNAAccess: ReadingDnaAccess;
};

/** Canonical numeric/boolean limits per membership tier. */
export const ENTITLEMENTS = {
  free: {
    customShelves: 1,
    savedQuotes: 25,
    quoteGraphicsPerMonth: 3,
    joinedBookClubs: 3,
    readingChallengesPerYear: 3,
    advancedReadingInsights: false,
    monthlyWrapped: false,
    aiReadingCompanion: false,
    quoteScanner: false,
    advancedReviews: false,
    clubPolls: false,
    clubAnalytics: false,
    readingDNAAccess: "top_three",
  },
  plus: {
    customShelves: Infinity,
    savedQuotes: Infinity,
    quoteGraphicsPerMonth: Infinity,
    joinedBookClubs: Infinity,
    readingChallengesPerYear: Infinity,
    advancedReadingInsights: true,
    monthlyWrapped: true,
    aiReadingCompanion: true,
    quoteScanner: true,
    advancedReviews: true,
    clubPolls: true,
    clubAnalytics: true,
    readingDNAAccess: "full",
  },
  home: {
    customShelves: Infinity,
    savedQuotes: Infinity,
    quoteGraphicsPerMonth: Infinity,
    joinedBookClubs: Infinity,
    readingChallengesPerYear: Infinity,
    advancedReadingInsights: true,
    monthlyWrapped: true,
    aiReadingCompanion: true,
    quoteScanner: true,
    advancedReviews: true,
    clubPolls: true,
    clubAnalytics: true,
    readingDNAAccess: "advanced",
  },
} as const satisfies Record<SubscriptionTier, TierEntitlements>;

/** Plus FeatureKeys (and Home includes these + Home-only product surfaces). */
export const PLUS_FEATURE_KEYS = [
  "custom_shelves",
  "saved_quotes",
  "quote_graphics",
  "joined_book_clubs",
  "reading_challenges",
  "advanced_reading_insights",
  "reading_speed",
  "reading_time",
  "pages_by_week",
  "pages_by_month",
  "reading_habits",
  "favorite_authors",
  "mood_analytics",
  "year_over_year_comparison",
  "advanced_reading_goals",
  "reading_heatmaps",
  "monthly_wrapped",
  "ai_reading_companion",
  "quote_scanner",
  "advanced_reviews",
  "club_polls",
  "club_analytics",
  "full_reading_dna",
  "reading_dna_ai_insights",
  "reading_dna_book_matches",
  "reading_dna_year_comparison",
] as const satisfies readonly FeatureKey[];

/** Home-only product surfaces beyond the FeatureKey matrix (maps, concierge, etc.). */
export const HOME_ONLY_FEATURES = [
  "book_map",
  "reader_map",
  "reading_dna_match",
  "premium_events",
  "concierge",
  "priority_support",
  "home_hub",
  "home_meetups",
  "home_experiences",
  "priority_feature_requests",
  "merch_early_access",
  "partner_benefits",
] as const;

type HomeOnlyFeature = (typeof HOME_ONLY_FEATURES)[number];

/** Legacy PremiumFeature / UI keys → canonical FeatureKey (or free-pass / home-only). */
const LEGACY_FEATURE_ALIASES: Record<string, FeatureKey | "free" | HomeOnlyFeature> = {
  tracker: "free",
  library: "free",
  goals: "free",
  feed: "free",
  reviews: "free",
  basic_ai: "free",
  stats: "free",
  reading_dna_traits: "free",
  custom_shelf: "custom_shelves",
  reading_insights: "advanced_reading_insights",
  advanced_analytics: "advanced_reading_insights",
  heatmaps: "reading_heatmaps",
  ai_companion: "ai_reading_companion",
  ai_insights: "reading_dna_ai_insights",
  quote_vault: "saved_quotes",
  unlimited_quotes: "saved_quotes",
  unlimited_clubs: "joined_book_clubs",
  unlimited_challenges: "reading_challenges",
  reading_dna_dashboard: "full_reading_dna",
  book_matches: "reading_dna_book_matches",
  book_map: "book_map",
  reader_map: "reader_map",
  reading_dna_match: "reading_dna_match",
  premium_events: "premium_events",
  concierge: "concierge",
  priority_support: "priority_support",
  home_hub: "home_hub",
  home_meetups: "home_meetups",
  home_experiences: "home_experiences",
  priority_feature_requests: "priority_feature_requests",
  merch_early_access: "merch_early_access",
  partner_benefits: "partner_benefits",
};

const FEATURE_KEY_SET = new Set<string>(PLUS_FEATURE_KEYS);
const HOME_ONLY_SET = new Set<string>(HOME_ONLY_FEATURES);

function resolveFeature(feature: FeatureKey | PremiumFeature | string): {
  kind: "free" | "feature" | "home" | "unknown";
  key?: FeatureKey | HomeOnlyFeature;
} {
  if (feature in LEGACY_FEATURE_ALIASES) {
    const mapped = LEGACY_FEATURE_ALIASES[feature]!;
    if (mapped === "free") return { kind: "free" };
    if (HOME_ONLY_SET.has(mapped)) return { kind: "home", key: mapped as HomeOnlyFeature };
    return { kind: "feature", key: mapped as FeatureKey };
  }
  if (FEATURE_KEY_SET.has(feature)) return { kind: "feature", key: feature as FeatureKey };
  if (HOME_ONLY_SET.has(feature)) return { kind: "home", key: feature as HomeOnlyFeature };
  return { kind: "unknown" };
}

/** Statuses that grant paid entitlements (subject to expiry when set). */
const ENTITLED_STATUSES = new Set<SubscriptionStatus>([
  "active",
  "trialing",
  "past_due",
  "grace_period",
  // Canceled-at-period-end: keep access until subscription_expires_at.
  "canceled",
]);

export function subscriptionIsActive(access: SubscriptionAccess | null | undefined): boolean {
  if (!access || access.subscription_tier === "free") return false;
  if (access.subscription_status === "expired" || access.subscription_status === "inactive") {
    return false;
  }
  if (!ENTITLED_STATUSES.has(access.subscription_status)) return false;

  if (!access.subscription_expires_at) {
    // Canceled without an expiry must not retain access indefinitely.
    return access.subscription_status !== "canceled";
  }

  const expiresAt = new Date(access.subscription_expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function resolveSubscriptionTier(
  access: SubscriptionAccess | null | undefined
): SubscriptionTier {
  if (!subscriptionIsActive(access) || !access) return "free";
  return access.subscription_tier;
}

export function getEntitlements(
  tierOrAccess: SubscriptionTier | SubscriptionAccess | null | undefined
): TierEntitlements {
  const tier: SubscriptionTier =
    typeof tierOrAccess === "string"
      ? tierOrAccess
      : resolveSubscriptionTier(tierOrAccess);
  return ENTITLEMENTS[tier];
}

/**
 * Feature-flag style access for canonical FeatureKey (and legacy PremiumFeature aliases).
 * Free-tier limits (e.g. 1 custom shelf) are enforced via limit helpers, not this boolean.
 */
export function canAccessFeature(
  feature: FeatureKey | PremiumFeature | string,
  access: SubscriptionAccess | null | undefined
): boolean {
  const resolved = resolveFeature(feature);
  if (resolved.kind === "unknown") return true;
  if (resolved.kind === "free") return true;

  const tier = resolveSubscriptionTier(access);
  if (resolved.kind === "home") return tier === "home";

  // FeatureKey matrix: free users get limited DNA/top traits only via readingDNAAccess;
  // boolean FeatureKeys that map to false on free require plus/home.
  const key = resolved.key as FeatureKey;
  const entitlements = ENTITLEMENTS[tier];

  switch (key) {
    case "custom_shelves":
    case "saved_quotes":
    case "quote_graphics":
    case "joined_book_clubs":
    case "reading_challenges":
      // Always "accessible"; enforce counts with limit helpers.
      return true;
    case "advanced_reading_insights":
    case "reading_speed":
    case "reading_time":
    case "pages_by_week":
    case "pages_by_month":
    case "reading_habits":
    case "favorite_authors":
    case "mood_analytics":
    case "year_over_year_comparison":
    case "advanced_reading_goals":
    case "reading_heatmaps":
      return entitlements.advancedReadingInsights;
    case "monthly_wrapped":
      return entitlements.monthlyWrapped;
    case "ai_reading_companion":
      return entitlements.aiReadingCompanion;
    case "quote_scanner":
      return entitlements.quoteScanner;
    case "advanced_reviews":
      return entitlements.advancedReviews;
    case "club_polls":
      return entitlements.clubPolls;
    case "club_analytics":
      return entitlements.clubAnalytics;
    case "full_reading_dna":
      return entitlements.readingDNAAccess === "full" || entitlements.readingDNAAccess === "advanced";
    case "reading_dna_ai_insights":
    case "reading_dna_book_matches":
    case "reading_dna_year_comparison":
      return entitlements.readingDNAAccess === "full" || entitlements.readingDNAAccess === "advanced";
    default:
      return tier !== "free";
  }
}

export function isPremiumSubscriber(
  access: SubscriptionAccess | null | undefined
): boolean {
  return subscriptionIsActive(access);
}

export const ENTITLEMENT_LIMIT_MESSAGES = {
  custom_shelves:
    "Free members can create 1 custom shelf. Upgrade to Bookmarked Plus for unlimited shelves.",
  saved_quotes:
    "Free members can save 25 quotes. Upgrade to Bookmarked Plus for unlimited quote vault space.",
  quote_graphics:
    "Free members can create 3 quote graphics per month. Upgrade to Bookmarked Plus for unlimited graphics.",
  joined_book_clubs:
    "Free members can be in 3 book clubs. Creating or joining both count. Upgrade to Bookmarked Plus for unlimited clubs.",
  reading_challenges:
    "Free members can join 3 community, club, or friend challenges per year. Official Bookmarked challenges do not use a slot. Upgrade to Bookmarked Plus for unlimited challenges.",
  create_reading_challenge:
    "Creating reading challenges is a Bookmarked Plus feature. Subscribe in the Bookmarked iOS app — Plus then unlocks here automatically.",
} as const;

export type EntitlementCheckResult = {
  allowed: boolean;
  reason: string | null;
  currentUsage: number;
  limit: number;
};

export function checkCountLimit(
  currentUsage: number,
  limit: number,
  reason: string
): EntitlementCheckResult {
  const allowed = currentUsage < limit;
  return {
    allowed,
    reason: allowed ? null : reason,
    currentUsage,
    limit,
  };
}

export function checkCustomShelfLimit(
  currentCount: number,
  access: SubscriptionAccess | null | undefined
): EntitlementCheckResult {
  return checkCountLimit(
    currentCount,
    getEntitlements(access).customShelves,
    ENTITLEMENT_LIMIT_MESSAGES.custom_shelves
  );
}

export function checkSavedQuoteLimit(
  currentCount: number,
  access: SubscriptionAccess | null | undefined
): EntitlementCheckResult {
  return checkCountLimit(
    currentCount,
    getEntitlements(access).savedQuotes,
    ENTITLEMENT_LIMIT_MESSAGES.saved_quotes
  );
}

export function checkQuoteGraphicLimit(
  createdThisMonth: number,
  access: SubscriptionAccess | null | undefined
): EntitlementCheckResult {
  return checkCountLimit(
    createdThisMonth,
    getEntitlements(access).quoteGraphicsPerMonth,
    ENTITLEMENT_LIMIT_MESSAGES.quote_graphics
  );
}

export function checkBookClubJoinLimit(
  joinedCount: number,
  access: SubscriptionAccess | null | undefined
): EntitlementCheckResult {
  return checkCountLimit(
    joinedCount,
    getEntitlements(access).joinedBookClubs,
    ENTITLEMENT_LIMIT_MESSAGES.joined_book_clubs
  );
}

export function checkReadingChallengeJoinLimit(
  joinedThisYear: number,
  access: SubscriptionAccess | null | undefined
): EntitlementCheckResult {
  return checkCountLimit(
    joinedThisYear,
    getEntitlements(access).readingChallengesPerYear,
    ENTITLEMENT_LIMIT_MESSAGES.reading_challenges
  );
}

export function canCreateCustomShelf(
  currentCount: number,
  access: SubscriptionAccess | null | undefined
): boolean {
  return checkCustomShelfLimit(currentCount, access).allowed;
}

export function canSaveQuote(
  currentCount: number,
  access: SubscriptionAccess | null | undefined
): boolean {
  return checkSavedQuoteLimit(currentCount, access).allowed;
}

export function canCreateQuoteGraphic(
  createdThisMonth: number,
  access: SubscriptionAccess | null | undefined
): boolean {
  return checkQuoteGraphicLimit(createdThisMonth, access).allowed;
}

export function canJoinBookClub(
  joinedCount: number,
  access: SubscriptionAccess | null | undefined
): boolean {
  return checkBookClubJoinLimit(joinedCount, access).allowed;
}

export function canJoinReadingChallenge(
  joinedThisYear: number,
  access: SubscriptionAccess | null | undefined
): boolean {
  return checkReadingChallengeJoinLimit(joinedThisYear, access).allowed;
}

/**
 * Every active club membership consumes the Free 3-club cap,
 * including create-as-owner. Leave / delete frees the slot.
 */
export type ClubMembershipKind = "create_owner" | "join" | "invite_accept" | "request_approve";

export function clubMembershipConsumesJoinSlot(_kind: ClubMembershipKind): boolean {
  return true;
}

/**
 * Yearly Free challenge slots.
 * Official / Bookmarked featured (curated list) joins are free extras.
 * user / community / club / friend joins consume a slot.
 * `abandoned` is not a join kind in the engine (member status is
 * active / completed / left). Passing it means rejoin of the same
 * challenge — do not consume a second slot.
 */
export type ChallengeJoinKind =
  | "official"
  | "user"
  | "community"
  | "club"
  | "friend"
  | "abandoned";

export function challengeJoinConsumesYearlySlot(kind: ChallengeJoinKind): boolean {
  return kind !== "official" && kind !== "abandoned";
}

/** Map a challenge row (and optional rejoin) onto the join-kind taxonomy. */
export function resolveChallengeJoinKind(input: {
  ownerKind?: string | null;
  featured?: boolean;
  visibility?: string | null;
  isRejoin?: boolean;
}): ChallengeJoinKind {
  if (input.isRejoin) return "abandoned";
  if (input.ownerKind === "official" || input.featured) return "official";
  if (input.visibility === "friend") return "friend";
  if (input.visibility === "followers" || input.visibility === "public") return "community";
  return "user";
}

/** Whether this join should increment the yearly Free counter. */
export function challengeRecordConsumesYearlySlot(input: {
  ownerKind?: string | null;
  featured?: boolean;
  visibility?: string | null;
  isRejoin?: boolean;
}): boolean {
  return challengeJoinConsumesYearlySlot(resolveChallengeJoinKind(input));
}

/** Create Challenge is Plus/Home only. Join limits stay on the yearly cap. */
export function canCreateReadingChallenge(
  access: SubscriptionAccess | null | undefined
): boolean {
  return subscriptionIsActive(access);
}

export function getReadingDnaAccess(
  access: SubscriptionAccess | null | undefined
): ReadingDnaAccess {
  return getEntitlements(access).readingDNAAccess;
}

/** Normalize a DB subscription row into SubscriptionAccess (never trust client tier alone). */
export function toSubscriptionAccessFromRow(
  row: {
    subscription_tier?: string | null;
    subscription_status?: string | null;
    subscription_expires_at?: string | null;
  } | null | undefined
): SubscriptionAccess {
  const tier = row?.subscription_tier;
  const status = row?.subscription_status;
  return {
    subscription_tier:
      tier === "plus" || tier === "home" || tier === "free" ? tier : "free",
    subscription_status:
      status === "active" ||
      status === "trialing" ||
      status === "past_due" ||
      status === "canceled" ||
      status === "expired" ||
      status === "grace_period"
        ? status
        : "inactive",
    subscription_expires_at: row?.subscription_expires_at ?? null,
  };
}

/** Official upgrade-page display prices. iOS buttons still prefer StoreKit displayPrice. */
export { PLUS_ANNUAL_SAVINGS_COPY, PLUS_DISPLAY_PRICES } from "./plusPricing";
export { HOME_ANNUAL_SAVINGS_COPY, HOME_DISPLAY_PRICES } from "./homePricing";

/** Subscribe only on iOS. Web never starts checkout. */
export const IOS_SUBSCRIBE_COPY = {
  headline: "Subscribe on iPhone or iPad",
  body: "Bookmarked Plus is purchased in the iOS app. After you subscribe there, Plus unlocks automatically on bookmarked.online — no second purchase.",
  cta: "Open the Bookmarked iOS app",
  note: "Restore purchases in the iOS app if Plus does not appear after you subscribe.",
} as const;

export const IOS_HOME_SUBSCRIBE_COPY = {
  headline: "Subscribe to Bookmarked Home on iPhone or iPad",
  body: "Bookmarked Home is purchased in the iOS app. After you subscribe there, Home unlocks automatically on bookmarked.online — no second purchase.",
  cta: "Open the Bookmarked iOS app",
  note: "Restore purchases in the iOS app if Home does not appear after you subscribe.",
} as const;

/** Shown on Quote Graphics and Plus upgrade copy. No invented monthly Plus cap. */
export const PLUS_UNLIMITED_FAIR_USE_COPY =
  "Unlimited on Plus still has abuse and rate protection so the service stays reliable.";

export type EntitlementLimitFeature = keyof typeof ENTITLEMENT_LIMIT_MESSAGES;

export function isEntitlementLimitError(message: string): boolean {
  const normalized = message.toLocaleLowerCase();
  return Object.values(ENTITLEMENT_LIMIT_MESSAGES).some((entry) =>
    normalized.includes(entry.toLocaleLowerCase().slice(0, 32))
  ) || /upgrade to bookmarked plus/i.test(message);
}

/** @deprecated Prefer ENTITLEMENTS + FeatureKey. Compatibility export for older docs/UI. */
export const MEMBERSHIP_FEATURES = {
  free: ["tracker", "library", "goals", "feed", "reviews", "custom_shelf", "basic_ai", "stats", "reading_dna_traits"],
  plus: PLUS_FEATURE_KEYS,
  home: HOME_ONLY_FEATURES,
} as const;
