import {
  MESSAGE_EMOJI_CATEGORIES,
  type MessageEmojiCategory,
  type MessageEmojiOption,
} from "@/lib/constants/messageReactions";

const MAX_REACTION_EMOJI_LENGTH = 8;

export function isValidReactionEmoji(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_REACTION_EMOJI_LENGTH) return false;

  return /\p{Extended_Pictographic}/u.test(trimmed);
}

export function normalizeReactionEmoji(value: string): string {
  return value.trim().slice(0, MAX_REACTION_EMOJI_LENGTH);
}

function matchesQuery(option: MessageEmojiOption, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  if (option.emoji.includes(normalized)) return true;

  return option.keywords.some(
    (keyword) => keyword.includes(normalized) || normalized.includes(keyword)
  );
}

export function filterEmojiCategories(query: string): MessageEmojiCategory[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return MESSAGE_EMOJI_CATEGORIES;

  return MESSAGE_EMOJI_CATEGORIES.map((category) => ({
    ...category,
    emojis: category.emojis.filter((option) => matchesQuery(option, normalized)),
  })).filter((category) => category.emojis.length > 0);
}

export function customEmojiFromQuery(query: string): string | null {
  const trimmed = query.trim();
  if (!isValidReactionEmoji(trimmed)) return null;
  return normalizeReactionEmoji(trimmed);
}
