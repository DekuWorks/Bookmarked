/**
 * Shared note-tag color resolution.
 *
 * Color priority:
 * 1. Stored custom color (hex) when provided
 * 2. Category default tone
 * 3. Bookmarked purple (#B89DBB family)
 *
 * Note: `user_reading_note_categories` currently has no `color` column in schema.
 * When that lands, pass `storedColor` from the row; until then category defaults apply.
 */

import { readingNoteTagTone, type ReadingNoteTagTone } from "./readingNoteTags";

export type NoteTagInput = {
  label: string;
  /** Optional stored hex from a future custom-category color column. */
  color?: string | null;
  category?: string | null;
  isCustom?: boolean;
};

const BOOKMARKED_PURPLE: ReadingNoteTagTone = {
  background: "#E8D5E8",
  border: "#B89DBB",
  text: "#642F37",
};

function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim());
}

function contrastTextForHex(hex: string): string {
  const raw = hex.trim().replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Relative luminance threshold — dark text on light pills.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#642F37" : "#FAF8FC";
}

/** Resolve pill colors for any note tag (builtin, custom, mood, vibe, legacy). */
export function resolveNoteTagTone(input: NoteTagInput): ReadingNoteTagTone {
  const stored = input.color?.trim();
  if (stored && isHexColor(stored)) {
    return {
      background: stored,
      border: stored,
      text: contrastTextForHex(stored),
    };
  }

  if (input.category) {
    return readingNoteTagTone(input.category);
  }

  if (input.isCustom) {
    return BOOKMARKED_PURPLE;
  }

  return BOOKMARKED_PURPLE;
}
