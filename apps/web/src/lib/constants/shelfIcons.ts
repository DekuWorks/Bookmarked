import type { ShelfStatus } from "@/types";
import {
  CUSTOM_SHELF_ICON_ASSETS_READY,
  CUSTOM_SHELF_ICON_FILE,
  CUSTOM_SHELF_ICON_KEYS,
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  DEFAULT_SHELF_A11Y_LABEL,
  DEFAULT_SHELF_ICON_FILE,
  DEFAULT_SHELF_ICON_KEY,
  DEFAULT_SHELF_ICON_LABEL,
  DEFAULT_SHELF_ICON_ORDER,
  getCustomShelfA11yLabel,
  getCustomShelfIconFile,
  getDefaultShelfA11yLabel,
  parseCustomShelfIconWrite,
  resolveCustomShelfIconKey,
  sortDefaultShelfIconIds,
  type CustomShelfIconKey,
  type DefaultShelfIconId,
} from "@bookmarked/utils/shelfIcons";

export type ShelfIconId = DefaultShelfIconId;
export type {
  CustomShelfIconKey,
  DefaultShelfIconId,
  DefaultShelfIconKey,
} from "@bookmarked/utils/shelfIcons";

export {
  CUSTOM_SHELF_ICON_ASSETS_READY,
  CUSTOM_SHELF_ICON_KEYS,
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  DEFAULT_SHELF_ICON_ORDER,
  getCustomShelfA11yLabel,
  getDefaultShelfA11yLabel,
  parseCustomShelfIconWrite,
  resolveCustomShelfIconKey,
  sortDefaultShelfIconIds,
};

export type ShelfIconSize = "small" | "medium" | "large";

/**
 * Display sizes (~20% larger than prior 28/56/128). Frame matches the glyph —
 * no bordered tile; optional transparent hit padding comes from parent controls.
 */
export const SHELF_ICON_SIZE_PX: Record<ShelfIconSize, number> = {
  small: 34,
  medium: 68,
  large: 152,
};

/** Layout box equals glyph size — borderless, no padded square chrome. */
export const SHELF_ICON_FRAME_PX: Record<ShelfIconSize, number> = {
  small: 34,
  medium: 68,
  large: 152,
};

export type ShelfIconConfig = {
  id: ShelfIconId;
  iconKey: string;
  /** Public path under /assets/shelves/ */
  src: string;
  label: string;
  accessibilityLabel: string;
  sortOrder: number;
};

/** Product order: TBR → Currently Reading → Finished → DNF */
export const SHELF_ICON_ORDER: ShelfIconId[] = [...DEFAULT_SHELF_ICON_ORDER];

function defaultSrc(id: ShelfIconId): string {
  return `/assets/shelves/${DEFAULT_SHELF_ICON_FILE[id]}`;
}

export const SHELF_ICONS: Record<ShelfIconId, ShelfIconConfig> = {
  want_to_read: {
    id: "want_to_read",
    iconKey: DEFAULT_SHELF_ICON_KEY.want_to_read,
    src: defaultSrc("want_to_read"),
    label: DEFAULT_SHELF_ICON_LABEL.want_to_read,
    accessibilityLabel: DEFAULT_SHELF_A11Y_LABEL.want_to_read,
    sortOrder: 1,
  },
  currently_reading: {
    id: "currently_reading",
    iconKey: DEFAULT_SHELF_ICON_KEY.currently_reading,
    src: defaultSrc("currently_reading"),
    label: DEFAULT_SHELF_ICON_LABEL.currently_reading,
    accessibilityLabel: DEFAULT_SHELF_A11Y_LABEL.currently_reading,
    sortOrder: 2,
  },
  read: {
    id: "read",
    iconKey: DEFAULT_SHELF_ICON_KEY.read,
    src: defaultSrc("read"),
    label: DEFAULT_SHELF_ICON_LABEL.read,
    accessibilityLabel: DEFAULT_SHELF_A11Y_LABEL.read,
    sortOrder: 3,
  },
  dnf: {
    id: "dnf",
    iconKey: DEFAULT_SHELF_ICON_KEY.dnf,
    src: defaultSrc("dnf"),
    label: DEFAULT_SHELF_ICON_LABEL.dnf,
    accessibilityLabel: DEFAULT_SHELF_A11Y_LABEL.dnf,
    sortOrder: 4,
  },
};

export type CustomShelfIconConfig = {
  key: CustomShelfIconKey;
  src: string;
  fallbackSrc: string;
  accessibilityLabel: string;
};

const CUSTOM_FALLBACK_SRC = `/assets/shelves/${getCustomShelfIconFile(DEFAULT_CUSTOM_SHELF_ICON_KEY)}`;

export function getCustomShelfIconSrc(iconKey?: string | null): string {
  const key = resolveCustomShelfIconKey(iconKey);
  if (!CUSTOM_SHELF_ICON_ASSETS_READY) {
    return CUSTOM_FALLBACK_SRC;
  }
  return `/assets/shelves/${CUSTOM_SHELF_ICON_FILE[key]}`;
}

export function getCustomShelfIconFallbackSrc(): string {
  return CUSTOM_FALLBACK_SRC;
}

export function getCustomShelfIconCatalog(): CustomShelfIconConfig[] {
  return CUSTOM_SHELF_ICON_KEYS.map((key) => ({
    key,
    src: getCustomShelfIconSrc(key),
    fallbackSrc: CUSTOM_FALLBACK_SRC,
    accessibilityLabel: getCustomShelfA11yLabel(key),
  }));
}

export function getShelfIconId(status: ShelfStatus): ShelfIconId {
  return status;
}

export function getShelfIconConfig(id: ShelfIconId): ShelfIconConfig {
  return SHELF_ICONS[id];
}

export function getShelfIconConfigForStatus(status: ShelfStatus): ShelfIconConfig {
  return SHELF_ICONS[status];
}

export function getShelfIconsInOrder(): ShelfIconConfig[] {
  return SHELF_ICON_ORDER.map((id) => SHELF_ICONS[id]);
}

/** Ensures built-in shelves render in product order regardless of input order. */
export function sortShelfIconIds(ids: ShelfIconId[]): ShelfIconId[] {
  return sortDefaultShelfIconIds(ids);
}
