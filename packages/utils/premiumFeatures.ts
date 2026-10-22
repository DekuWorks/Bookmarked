import { FREE_BOOK_CLUB_LIMIT } from "./pricingTiers";

export type PremiumFeatureLink = {
  id: string;
  tier: "free" | "plus" | "home";
  title: string;
  description: string;
  /** Web path (Reading Room Stats sections where applicable). */
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
      `Default bookshelves, one custom shelf, reading tracker, reviews, quotes, up to ${FREE_BOOK_CLUB_LIMIT} book clubs, and yearly Wrapped.`,
  },
  {
    id: "reading-insights",
    tier: "plus",
    title: "Bookmarked Plus",
    description:
      "Everything in Free, plus reading insights, the AI Reading Companion, unlimited quotes and clubs, and monthly Wrapped.",
    webHref: "/reading-room/?tab=stats#reading-activity",
    mobileHref: "/?tab=stats",
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
      "Everything in Plus, plus Book Map, Reader Map, exclusive experiences, and member access.",
    webHref: "/home-hub/",
    mobileHref: "/home-hub",
  },
];
