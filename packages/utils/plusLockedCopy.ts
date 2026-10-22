/** Locked Plus guidance on the website. There is no web checkout. */
export const PLUS_WEB_SUBSCRIBE_GUIDANCE =
  "Unlock this feature with Bookmarked Plus. Subscribe through the Bookmarked iOS app to access your Plus features across your account.";

export const STATS_PLUS_FEATURES = {
  analytics: {
    title: "Advanced Reading Analytics",
    description:
      "Unlock reading heatmaps, pace trends, and weekly activity charts with Bookmarked Plus.",
  },
  insights: {
    title: "AI Insights",
    description: "Get personalized reflections and reading patterns powered by your trail.",
  },
} as const;

export const STATS_SECTION_ORDER = [
  "Reading Calendar",
  "Reading Statistics",
  STATS_PLUS_FEATURES.analytics.title,
  STATS_PLUS_FEATURES.insights.title,
] as const;
