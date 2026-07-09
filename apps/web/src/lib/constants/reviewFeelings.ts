export const REVIEW_FEELINGS = [
  "Happy",
  "Emotional",
  "Heartwarming",
  "Thought-provoking",
  "Dark",
  "Funny",
  "Suspenseful",
  "Romantic",
  "Adventurous",
  "Melancholy",
  "Inspiring",
  "Cozy",
] as const;

export type ReviewFeeling = (typeof REVIEW_FEELINGS)[number];
