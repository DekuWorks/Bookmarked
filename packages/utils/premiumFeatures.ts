export type PremiumFeatureLink = {
  id: string;
  title: string;
  description: string;
  /** Web path (Reading Room Progress tab sections where applicable). */
  webHref?: string;
  /** Mobile route — `tab` query opens Reading Room on the home screen. */
  mobileHref?: string;
};

export const PREMIUM_FEATURE_LINKS: PremiumFeatureLink[] = [
  {
    id: "advanced_analytics",
    title: "Advanced analytics",
    description:
      "Reading heatmaps, pace trends, monthly breakdowns, and deeper stats on your Progress tab.",
    webHref: "/reading-room/?tab=progress#reading-activity",
    mobileHref: "/?tab=progress",
  },
  {
    id: "ai_insights",
    title: "AI reading insights",
    description:
      "Personalized highlights, reading patterns, and reflection prompts powered by OpenAI from your trail.",
    webHref: "/reading-room/?tab=progress#ai-insights",
    mobileHref: "/?tab=progress",
  },
  {
    id: "early_access",
    title: "Early access",
    description: "Try new community, library, and mobile features before they roll out to everyone.",
    webHref: "/feed/",
    mobileHref: "/feed",
  },
  {
    id: "support",
    title: "Support Bookmarked",
    description: "Help us build a reader-first platform without ads or data selling.",
  },
];
