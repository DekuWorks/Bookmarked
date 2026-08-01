export type PremiumFeatureLink = {
  id: string;
  tier: "free" | "plus" | "home";
  title: string;
  description: string;
  /** Web path (Reading Room Progress tab sections where applicable). */
  webHref?: string;
  /** Mobile route — `tab` query opens Reading Room on the home screen. */
  mobileHref?: string;
};

export const PREMIUM_FEATURE_LINKS: PremiumFeatureLink[] = [
  {
    id: "free-foundation",
    tier: "free",
    title: "Free",
    description:
      "Tracker, library, goals, feed, reviews, one custom shelf, basic AI, stats, and your top 3 Reading DNA traits.",
  },
  {
    id: "reading-insights",
    tier: "plus",
    title: "Bookmarked Plus",
    description:
      "Reading Insights, Reading Speed, Mood Analytics, Heatmaps, AI Companion, Quote Vault, and unlimited quotes, clubs, and challenges.",
    webHref: "/reading-room/?tab=progress#reading-activity",
    mobileHref: "/?tab=progress",
  },
  {
    id: "reading-dna",
    tier: "plus",
    title: "Full Reading DNA",
    description:
      "Explore your full DNA dashboard, AI insights, and personalized book-match hooks.",
  },
  {
    id: "bookmarked-home",
    tier: "home",
    title: "Bookmarked Home",
    description:
      "Book Map, Reader Map, Reading DNA Match, Premium Events, concierge help, and priority support.",
  },
];
