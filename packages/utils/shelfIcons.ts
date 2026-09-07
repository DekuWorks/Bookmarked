/**
 * Canonical shelf icon mapping for web + iOS.
 *
 * Default shelves use stable DB IDs / slugs — never display labels.
 * Custom shelves persist `user_shelves.icon_key` (logical Bookmarked key)
 * plus optional `icon_type` / `icon_emoji` for a user-chosen emoji.
 *
 * waiting-on-assets: Leighton has not delivered the 5 custom PNGs.
 * Until those files land, every custom key renders the Bookmarked B-mark
 * (`logo-mark.png`) — not any of the four default-shelf icons.
 */

import type { ShelfStatus } from "../types";

export type DefaultShelfIconId = ShelfStatus | "dnf";

export type DefaultShelfIconKey =
  | "stack_of_books"
  | "open_book"
  | "closed_book"
  | "book_with_sparkle";

export type CustomShelfIconKey =
  | "custom_icon_1"
  | "custom_icon_2"
  | "custom_icon_3"
  | "custom_icon_4"
  | "custom_icon_5";

export type CustomShelfIconType = "bookmarked" | "emoji";

export type CustomShelfIconSelection =
  | { type: "bookmarked"; value: CustomShelfIconKey }
  | { type: "emoji"; value: string };

export type CustomShelfIconRow = {
  icon_key?: string | null;
  icon_type?: string | null;
  icon_emoji?: string | null;
};

export type CustomShelfIconWrite = {
  icon_type: CustomShelfIconType;
  icon_key: CustomShelfIconKey;
  icon_emoji: string | null;
};

/** Exact heading for user-created shelves only. */
export const CUSTOM_COLLECTIONS_HEADING = "Custom Collections";

/** ZWJ / flag sequences can exceed one UTF-16 code unit. */
export const SHELF_EMOJI_MAX_UTF16_LENGTH = 32;

/** Product order: TBR → Currently Reading → Finished → DNF */
export const DEFAULT_SHELF_ICON_ORDER: DefaultShelfIconId[] = [
  "want_to_read",
  "currently_reading",
  "read",
  "dnf",
];

/**
 * Stable ID → logical glyph. Display labels must not be used as keys.
 * Website artwork was one slot off: cycle TBR ← CR ← DNF ← TBR; Finished stays.
 * After the shuffle the PNGs match the intended glyphs
 * (TBR = stack, Currently Reading = open book, DNF = closed book).
 */
export const DEFAULT_SHELF_ICON_KEY: Record<DefaultShelfIconId, DefaultShelfIconKey> = {
  want_to_read: "stack_of_books",
  currently_reading: "open_book",
  read: "book_with_sparkle",
  dnf: "closed_book",
};

/**
 * Approved purple PNG filenames (web public + iOS assets/shelves).
 * Filenames are historical — they do not match the shelf they now sit on.
 */
export const DEFAULT_SHELF_ICON_FILE: Record<DefaultShelfIconId, string> = {
  want_to_read: "currently-reading.png",
  currently_reading: "did-not-finish.png",
  read: "finished.png",
  dnf: "want-to-read.png",
};

export const DEFAULT_SHELF_ICON_LABEL: Record<DefaultShelfIconId, string> = {
  want_to_read: "TBR",
  currently_reading: "Currently Reading",
  read: "Finished",
  dnf: "DNF",
};

export const DEFAULT_SHELF_A11Y_LABEL: Record<DefaultShelfIconId, string> = {
  want_to_read: "TBR Shelf",
  currently_reading: "Currently Reading Shelf",
  read: "Finished Shelf",
  dnf: "DNF Shelf",
};

export const CUSTOM_SHELF_ICON_KEYS: readonly CustomShelfIconKey[] = [
  "custom_icon_1",
  "custom_icon_2",
  "custom_icon_3",
  "custom_icon_4",
  "custom_icon_5",
] as const;

/**
 * Preferred create default and missing-key fallback.
 * Not a random assignment of one of the 5 — always the first approved key.
 */
export const DEFAULT_CUSTOM_SHELF_ICON_KEY: CustomShelfIconKey = "custom_icon_1";

/** Expected drop-in filenames once Leighton delivers. */
export const CUSTOM_SHELF_ICON_FILE: Record<CustomShelfIconKey, string> = {
  custom_icon_1: "custom-icon-1.png",
  custom_icon_2: "custom-icon-2.png",
  custom_icon_3: "custom-icon-3.png",
  custom_icon_4: "custom-icon-4.png",
  custom_icon_5: "custom-icon-5.png",
};

export const CUSTOM_SHELF_A11Y_LABEL: Record<CustomShelfIconKey, string> = {
  custom_icon_1: "Custom Shelf Icon 1",
  custom_icon_2: "Custom Shelf Icon 2",
  custom_icon_3: "Custom Shelf Icon 3",
  custom_icon_4: "Custom Shelf Icon 4",
  custom_icon_5: "Custom Shelf Icon 5",
};

/**
 * False until Leighton files exist in web + iOS asset folders.
 * Visual fallback is the Bookmarked B-mark — none of the four default-shelf PNGs.
 */
export const CUSTOM_SHELF_ICON_ASSETS_READY = false;

export const CUSTOM_SHELF_ICON_FALLBACK_FILE = "logo-mark.png";

/** Web public path. B-mark lives at site root, not /assets/shelves/. */
export const CUSTOM_SHELF_ICON_FALLBACK_SRC = "/logo-mark.png";

const CUSTOM_KEY_SET = new Set<string>(CUSTOM_SHELF_ICON_KEYS);

export function isCustomShelfIconKey(value: unknown): value is CustomShelfIconKey {
  return typeof value === "string" && CUSTOM_KEY_SET.has(value);
}

export function isDefaultShelfIconId(value: unknown): value is DefaultShelfIconId {
  return (
    value === "want_to_read" ||
    value === "currently_reading" ||
    value === "read" ||
    value === "dnf"
  );
}

export function getDefaultShelfIconKey(id: DefaultShelfIconId): DefaultShelfIconKey {
  return DEFAULT_SHELF_ICON_KEY[id];
}

export function getDefaultShelfIconFile(id: DefaultShelfIconId): string {
  return DEFAULT_SHELF_ICON_FILE[id];
}

export function getDefaultShelfA11yLabel(id: DefaultShelfIconId): string {
  return DEFAULT_SHELF_A11Y_LABEL[id];
}

/** Existing shelves with null/invalid icon_key → documented fallback. Never blank. */
export function resolveCustomShelfIconKey(value: unknown): CustomShelfIconKey {
  return isCustomShelfIconKey(value) ? value : DEFAULT_CUSTOM_SHELF_ICON_KEY;
}

/**
 * Writes: missing/empty → first approved key.
 * Explicit invalid values are rejected (do not persist garbage).
 */
export function parseCustomShelfIconWrite(
  value: unknown
): { ok: true; value: CustomShelfIconKey } | { ok: false; error: string } {
  if (value == null || value === "") {
    return { ok: true, value: DEFAULT_CUSTOM_SHELF_ICON_KEY };
  }
  if (isCustomShelfIconKey(value)) {
    return { ok: true, value };
  }
  return { ok: false, error: "Choose an approved shelf icon." };
}

export function getCustomShelfA11yLabel(
  value: unknown,
  selected = false
): string {
  const key = resolveCustomShelfIconKey(value);
  const base = CUSTOM_SHELF_A11Y_LABEL[key];
  return selected ? `${base}, Selected` : base;
}

/** Filename to load for a custom key. Pending assets use the Bookmarked B-mark. */
export function getCustomShelfIconFile(value: unknown): string {
  const key = resolveCustomShelfIconKey(value);
  if (!CUSTOM_SHELF_ICON_ASSETS_READY) {
    return CUSTOM_SHELF_ICON_FALLBACK_FILE;
  }
  return CUSTOM_SHELF_ICON_FILE[key];
}

export function sortDefaultShelfIconIds(ids: DefaultShelfIconId[]): DefaultShelfIconId[] {
  const order = new Map(DEFAULT_SHELF_ICON_ORDER.map((id, index) => [id, index]));
  return [...ids].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99));
}

export const DEFAULT_CUSTOM_SHELF_ICON_SELECTION: CustomShelfIconSelection = {
  type: "bookmarked",
  value: DEFAULT_CUSTOM_SHELF_ICON_KEY,
};

const PATH_OR_BLOB_PATTERN = /[\\/]|https?:|blob:|data:|\.(png|svg|jpe?g|gif|webp)$/i;

function splitGraphemes(value: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(value)].map(
      (part) => part.segment
    );
  }
  return (
    value.match(
      /\p{RI}\p{RI}|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*|./gu
    ) ?? [...value]
  );
}

function graphemeLooksLikeEmoji(grapheme: string): boolean {
  if (!grapheme) return false;
  if (/^[\x00-\x7F]+$/.test(grapheme)) return false;
  return (
    /\p{Extended_Pictographic}/u.test(grapheme) ||
    /\p{Emoji_Presentation}/u.test(grapheme) ||
    (/\p{Emoji}/u.test(grapheme) && /[\uFE0F\u20E3\u200D]/u.test(grapheme))
  );
}

/** One emoji grapheme. Rejects letters, paths, blobs, and multi-emoji strings. */
export function sanitizeShelfEmoji(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > SHELF_EMOJI_MAX_UTF16_LENGTH) return null;
  if (PATH_OR_BLOB_PATTERN.test(trimmed)) return null;
  if (isCustomShelfIconKey(trimmed)) return null;

  const graphemes = splitGraphemes(trimmed);
  if (graphemes.length !== 1) return null;

  const grapheme = graphemes[0];
  if (!graphemeLooksLikeEmoji(grapheme)) return null;
  return grapheme;
}

export function isValidShelfEmoji(value: unknown): value is string {
  return sanitizeShelfEmoji(value) !== null;
}

export function isCustomShelfIconType(value: unknown): value is CustomShelfIconType {
  return value === "bookmarked" || value === "emoji";
}

export function resolveCustomShelfIcon(
  row?: CustomShelfIconRow | null
): CustomShelfIconSelection {
  if (row?.icon_type === "emoji") {
    const emoji = sanitizeShelfEmoji(row.icon_emoji);
    if (emoji) return { type: "emoji", value: emoji };
  }
  return {
    type: "bookmarked",
    value: resolveCustomShelfIconKey(row?.icon_key),
  };
}

export function customShelfIconProps(row?: CustomShelfIconRow | null): CustomShelfIconRow {
  return {
    icon_key: row?.icon_key ?? null,
    icon_type: row?.icon_type ?? null,
    icon_emoji: row?.icon_emoji ?? null,
  };
}

function isIconSelection(value: unknown): value is CustomShelfIconSelection {
  if (!value || typeof value !== "object") return false;
  const record = value as { type?: unknown; value?: unknown };
  return (
    (record.type === "bookmarked" || record.type === "emoji") &&
    typeof record.value === "string"
  );
}

/**
 * Writes: approved Bookmarked key or a sanitized emoji grapheme.
 * Empty/missing → first approved key. Invalid values are rejected.
 */
export function parseCustomShelfIconSelection(
  input?: CustomShelfIconRow | CustomShelfIconSelection | null
): { ok: true; value: CustomShelfIconWrite } | { ok: false; error: string } {
  if (input == null) {
    return {
      ok: true,
      value: {
        icon_type: "bookmarked",
        icon_key: DEFAULT_CUSTOM_SHELF_ICON_KEY,
        icon_emoji: null,
      },
    };
  }

  if (isIconSelection(input)) {
    if (input.type === "emoji") {
      const emoji = sanitizeShelfEmoji(input.value);
      if (!emoji) {
        return { ok: false, error: "Choose a single emoji." };
      }
      return {
        ok: true,
        value: {
          icon_type: "emoji",
          icon_key: DEFAULT_CUSTOM_SHELF_ICON_KEY,
          icon_emoji: emoji,
        },
      };
    }
    const keyParsed = parseCustomShelfIconWrite(input.value);
    if (!keyParsed.ok) return keyParsed;
    return {
      ok: true,
      value: {
        icon_type: "bookmarked",
        icon_key: keyParsed.value,
        icon_emoji: null,
      },
    };
  }

  if (input.icon_type === "emoji") {
    const emoji = sanitizeShelfEmoji(input.icon_emoji);
    if (!emoji) {
      return { ok: false, error: "Choose a single emoji." };
    }
    const fallbackKey = isCustomShelfIconKey(input.icon_key)
      ? input.icon_key
      : DEFAULT_CUSTOM_SHELF_ICON_KEY;
    return {
      ok: true,
      value: {
        icon_type: "emoji",
        icon_key: fallbackKey,
        icon_emoji: emoji,
      },
    };
  }

  const keyParsed = parseCustomShelfIconWrite(
    input.icon_key === undefined ? DEFAULT_CUSTOM_SHELF_ICON_KEY : input.icon_key
  );
  if (!keyParsed.ok) return keyParsed;
  return {
    ok: true,
    value: {
      icon_type: "bookmarked",
      icon_key: keyParsed.value,
      icon_emoji: null,
    },
  };
}

export function getCustomShelfIconA11yLabel(
  rowOrSelection?: CustomShelfIconRow | CustomShelfIconSelection | null,
  selected = false
): string {
  const selection = isIconSelection(rowOrSelection)
    ? rowOrSelection
    : resolveCustomShelfIcon(rowOrSelection);
  const base =
    selection.type === "emoji"
      ? selection.value
        ? `Emoji ${selection.value}`
        : "Emoji shelf icon"
      : CUSTOM_SHELF_A11Y_LABEL[selection.value];
  return selected ? `${base}, Selected` : base;
}
