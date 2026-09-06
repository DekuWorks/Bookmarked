/**
 * Plus advanced review extras.
 * Reread Likelihood and character ratings share the review 5-star half-star scale.
 */

import { parseHalfStarRating } from "./starRatingDisplay";

export const WOULD_RECOMMEND_VALUES = ["yes", "no"] as const;
export type WouldRecommend = (typeof WOULD_RECOMMEND_VALUES)[number];

export const REREAD_LIKELIHOOD_SCALE_KEY = "stars_5_half";

/** Same 5-star half-star control as reviews. Not a 1–10 scale. */
export const REREAD_LIKELIHOOD_SCALE = {
  status: "stars_5_half",
  key: REREAD_LIKELIHOOD_SCALE_KEY,
  min: 0.5,
  max: 5,
  step: 0.5,
  note: "Same 5-star, half-star scale as reviews. Optional — leave unset if you prefer.",
} as const;

export type RereadLikelihood = {
  value: number | null;
  scaleKey: typeof REREAD_LIKELIHOOD_SCALE_KEY | null;
};

export type ChapterReviewDraft = {
  chapterNumber: number;
  body: string;
};

export type FavoriteChapterDraft = {
  chapterNumber: number;
  label?: string | null;
};

export type CharacterRatingDraft = {
  name: string;
  /** Optional 5-star half-star score. Not required to publish. */
  score: number | null;
};

export function parseWouldRecommend(value: unknown): WouldRecommend | null {
  if (value === "yes" || value === "no") return value;
  if (value === true) return "yes";
  if (value === false) return "no";
  return null;
}

export function validateChapterNumber(
  value: unknown
): { ok: true; chapterNumber: number } | { ok: false; error: string } {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 10_000) {
    return { ok: false, error: "Enter a chapter number of 1 or more." };
  }
  return { ok: true, chapterNumber: number };
}

export function validateCharacterName(
  name: string
): { ok: true; name: string } | { ok: false; error: string } {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return { ok: false, error: "Enter a character name." };
  if (trimmed.length > 80) return { ok: false, error: "Character names must be 80 characters or fewer." };
  return { ok: true, name: trimmed };
}

export function parseCharacterScore(value: unknown): number | null {
  return parseHalfStarRating(value);
}

export function parseRereadLikelihood(input: {
  value?: unknown;
  scaleKey?: string | null;
}): RereadLikelihood {
  const value = parseHalfStarRating(input.value);
  if (value == null) return { value: null, scaleKey: null };
  return { value, scaleKey: REREAD_LIKELIHOOD_SCALE_KEY };
}
