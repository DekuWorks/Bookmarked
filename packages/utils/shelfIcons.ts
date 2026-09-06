/**
 * Canonical shelf icon mapping for web + iOS.
 *
 * Default shelves use stable DB IDs / slugs — never display labels.
 * Custom shelves persist `user_shelves.icon_key` (logical key only).
 *
 * waiting-on-assets: Leighton has not delivered the 5 custom PNGs.
 * Until those files land, every custom key renders the approved
 * stack-of-books fallback (`want-to-read.png`). Do not treat that as
 * final custom artwork.
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

/** Product order: TBR → Currently Reading → Finished → DNF */
export const DEFAULT_SHELF_ICON_ORDER: DefaultShelfIconId[] = [
  "want_to_read",
  "currently_reading",
  "read",
  "dnf",
];

/**
 * Stable ID → logical glyph. Display labels must not be used as keys.
 * TBR = stack of books, Currently Reading = open book,
 * DNF = closed book, Finished = book with sparkle.
 */
export const DEFAULT_SHELF_ICON_KEY: Record<DefaultShelfIconId, DefaultShelfIconKey> = {
  want_to_read: "stack_of_books",
  currently_reading: "open_book",
  read: "book_with_sparkle",
  dnf: "closed_book",
};

/** Approved purple PNG filenames (web public + iOS assets/shelves). */
export const DEFAULT_SHELF_ICON_FILE: Record<DefaultShelfIconId, string> = {
  want_to_read: "want-to-read.png",
  currently_reading: "currently-reading.png",
  read: "finished.png",
  dnf: "did-not-finish.png",
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
 * Visual fallback file is the approved stack-of-books PNG.
 */
export const CUSTOM_SHELF_ICON_ASSETS_READY = false;

export const CUSTOM_SHELF_ICON_FALLBACK_FILE = DEFAULT_SHELF_ICON_FILE.want_to_read;

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

/** Filename to load for a custom key. Pending assets use the stack-of-books fallback. */
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
