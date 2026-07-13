/**
 * Curated set of signature emojis a reader can attach to a rating (Fable-style),
 * e.g. ⚡ for Harry Potter. Users can also type their own via the freeform field.
 */
export const REVIEW_RATING_EMOJIS = [
  "⚡",
  "❤️",
  "🔥",
  "😭",
  "😍",
  "🤯",
  "🥹",
  "😱",
  "🗡️",
  "🐉",
  "👑",
  "🌙",
  "⭐",
  "🌹",
  "🕯️",
  "☕",
  "🧙",
  "💀",
  "🚀",
  "🌊",
] as const;

/**
 * Keep freeform emoji input lean and aligned with the DB length constraint
 * (reviews_rating_emoji_length allows 1–16 chars).
 */
export const REVIEW_RATING_EMOJI_MAX_LENGTH = 16;

export function sanitizeRatingEmoji(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, REVIEW_RATING_EMOJI_MAX_LENGTH);
}
