/**
 * Official Free / Plus / Home feature catalog.
 * Developer reference for web and iOS. Home includes Plus includes Free.
 * Display prices live in plusPricing.ts and homePricing.ts — do not invent amounts here.
 * Describing a Home feature does not mean that product is built.
 */

export const FREE_CUSTOM_SHELF_LIMIT = 1;
export const FREE_SAVED_QUOTE_LIMIT = 25;
export const FREE_QUOTE_GRAPHICS_PER_MONTH = 3;
export const FREE_BOOK_CLUB_LIMIT = 3;

/** Plus and Home have no cap on the four Free count limits. */
export const UNLIMITED_PLAN_LIMIT = Number.POSITIVE_INFINITY;

export const PRICING_TIER_IDS = ["free", "plus", "home"] as const;

export type PricingTierId = (typeof PRICING_TIER_IDS)[number];

export type PricingTierLimits = {
  customShelves: number;
  savedQuotes: number;
  quoteGraphicsPerMonth: number;
  joinedBookClubs: number;
};

export const PRICING_TIER_LIMITS: Record<PricingTierId, PricingTierLimits> = {
  free: {
    customShelves: FREE_CUSTOM_SHELF_LIMIT,
    savedQuotes: FREE_SAVED_QUOTE_LIMIT,
    quoteGraphicsPerMonth: FREE_QUOTE_GRAPHICS_PER_MONTH,
    joinedBookClubs: FREE_BOOK_CLUB_LIMIT,
  },
  plus: {
    customShelves: UNLIMITED_PLAN_LIMIT,
    savedQuotes: UNLIMITED_PLAN_LIMIT,
    quoteGraphicsPerMonth: UNLIMITED_PLAN_LIMIT,
    joinedBookClubs: UNLIMITED_PLAN_LIMIT,
  },
  home: {
    customShelves: UNLIMITED_PLAN_LIMIT,
    savedQuotes: UNLIMITED_PLAN_LIMIT,
    quoteGraphicsPerMonth: UNLIMITED_PLAN_LIMIT,
    joinedBookClubs: UNLIMITED_PLAN_LIMIT,
  },
};

export type PricingFeatureGroup = {
  id: string;
  heading: string;
  items: readonly string[];
};

export type PricingTierDefinition = {
  id: PricingTierId;
  name: string;
  tagline: string;
  /** Null on Free. Plus and Home name the tier they include. */
  includesLabel: string | null;
  groups: readonly PricingFeatureGroup[];
};

export const PRICING_TIER_CATALOG: readonly PricingTierDefinition[] = [
  {
    id: "free",
    name: "Free",
    tagline: "The essentials",
    includesLabel: null,
    groups: [
      {
        id: "shelves",
        heading: "Shelves",
        items: [
          "Default bookshelves",
          "Create one custom shelf",
          "Hide shelves / make them private",
          "Track audiobooks",
        ],
      },
      {
        id: "reading",
        heading: "Reading",
        items: [
          "Reading tracker, progress, and re-read tracker",
          "Reading calendar",
          "Yearly books-read goal",
        ],
      },
      {
        id: "reviews",
        heading: "Reviews and notes",
        items: [
          "Overall star rating (half stars)",
          "Categorized reviews",
          "Date started / finished",
          "Mood / Vibe tags",
          `Favorite quotes, ${FREE_SAVED_QUOTE_LIMIT} maximum, with PDF export`,
          "Notes",
          "Hidden spoilers",
        ],
      },
      {
        id: "community",
        heading: "Community",
        items: [
          "Follow friends",
          "Instagram-style feed",
          "Comments and likes",
          "Public profiles",
          "Share reading updates",
          `Join up to ${FREE_BOOK_CLUB_LIMIT} book clubs`,
          "Browse reader shelves",
        ],
      },
      {
        id: "discovery",
        heading: "Discovery",
        items: [
          "Basic recommendations / trending",
          "Event calendar",
          "Affiliate shopping links",
          `Quote graphic creation, ${FREE_QUOTE_GRAPHICS_PER_MONTH} per month`,
          "Yearly Bookmarked Wrapped",
        ],
      },
    ],
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Reading intelligence",
    includesLabel: "Everything in Free",
    groups: [
      {
        id: "insights",
        heading: "Reading insights",
        items: [
          "Reading speed",
          "Reading time",
          "Pages by week",
          "Pages by month",
          "Reading habits",
          "Favorite authors",
          "Mood analytics",
          "Year-over-year comparisons",
          "Advanced reading goals (extra goals)",
          "Reading heatmaps",
          "Monthly Reading Wrapped",
        ],
      },
      {
        id: "companion",
        heading: "AI Reading Companion",
        items: [
          "Discussion questions",
          "Character relationship maps",
          "Ending explanations",
          "Event timelines",
          "Reading schedule",
        ],
      },
      {
        id: "recommendations",
        heading: "Recommendations",
        items: ["Personalized TBR / enhanced recommendations"],
      },
      {
        id: "quotes",
        heading: "Quote vault",
        items: [
          "Unlimited quotes",
          "Quote scanner (photo to text)",
          "Unlimited quote graphics",
        ],
      },
      {
        id: "reviews",
        heading: "Better reviews",
        items: [
          "Chapter reviews",
          "Chapter bookmarks (favorite chapters)",
          "Individual character ratings (optional)",
          "Would recommend?",
          "Reread likelihood",
        ],
      },
      {
        id: "community",
        heading: "Community+",
        items: [
          "Unlimited book clubs / discussion rooms",
          "Unlimited reading challenges",
          "Polls",
          "Club analytics",
        ],
      },
    ],
  },
  {
    id: "home",
    name: "Home",
    tagline: "Real-world community",
    includesLabel: "Everything in Plus",
    groups: [
      {
        id: "book-map",
        heading: "Book Map",
        items: [
          "Interactive map of independent bookstores, libraries, and reading cafes",
        ],
      },
      {
        id: "reader-map",
        heading: "Reader Map",
        items: [
          "See readers nearby",
          "Filter by favorite genre, favorite books, favorite tropes, reading personality, book clubs, colleges, and cities",
          "Follow nearby readers",
          "Join local clubs",
          "Create meetups",
        ],
      },
      {
        id: "experiences",
        heading: "Exclusive experiences",
        items: [
          "Author Q&As with no fee (basic pays a fee)",
          "Virtual events such as a 24-hour reading sprint",
          "Zoom / video call option",
        ],
      },
      {
        id: "access",
        heading: "Member access",
        items: [
          "Beta features",
          "Exclusive merch access / early merch drops",
          "Partner discounts / priority event tickets",
          "Premium lifestyle: Reading DNA, concierge features",
        ],
      },
    ],
  },
];

export function pricingTierById(id: PricingTierId): PricingTierDefinition {
  const tier = PRICING_TIER_CATALOG.find((entry) => entry.id === id);
  if (!tier) {
    throw new Error(`Unknown pricing tier: ${id}`);
  }
  return tier;
}

export function pricingTierFeatureItems(id: PricingTierId): readonly string[] {
  return pricingTierById(id).groups.flatMap((group) => group.items);
}

/** Features this tier includes, counting lower tiers. Home includes Plus includes Free. */
export function includedPricingFeatureItems(id: PricingTierId): readonly string[] {
  const index = PRICING_TIER_IDS.indexOf(id);
  return PRICING_TIER_IDS.slice(0, index + 1).flatMap((tierId) =>
    pricingTierFeatureItems(tierId)
  );
}
