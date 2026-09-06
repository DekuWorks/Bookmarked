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
      "Reading Insights, Monthly Wrapped, AI Companion, Quote Scanner, club polls, and unlimited quotes, clubs, and challenges. Unlimited still has abuse and rate protection.",
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
      "Real-world community, Book Map, local Reader Map, experiences, Reading DNA identity, and concierge — not more analytics.",
    webHref: "/home-hub/",
    mobileHref: "/home-hub",
  },
];
