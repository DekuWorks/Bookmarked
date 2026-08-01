import type { ImageSourcePropType } from "react-native";
import type { ShelfStatus } from "../types";

/** Built-in shelf icon keys — matches DB shelf_status values plus DNF flag. */
export type ShelfIconId = ShelfStatus | "dnf";

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
  source: ImageSourcePropType;
  label: string;
  accessibilityLabel: string;
  sortOrder: number;
};

/** Product order: TBR → Currently Reading → Finished → DNF */
export const SHELF_ICON_ORDER: ShelfIconId[] = [
  "want_to_read",
  "currently_reading",
  "read",
  "dnf",
];

export const SHELF_ICONS: Record<ShelfIconId, ShelfIconConfig> = {
  want_to_read: {
    id: "want_to_read",
    source: require("../../assets/shelves/want-to-read.png"),
    label: "TBR",
    accessibilityLabel: "Want to Read shelf",
    sortOrder: 1,
  },
  currently_reading: {
    id: "currently_reading",
    source: require("../../assets/shelves/currently-reading.png"),
    label: "Currently Reading",
    accessibilityLabel: "Currently Reading shelf",
    sortOrder: 2,
  },
  read: {
    id: "read",
    source: require("../../assets/shelves/finished.png"),
    label: "Finished",
    accessibilityLabel: "Finished shelf",
    sortOrder: 3,
  },
  dnf: {
    id: "dnf",
    source: require("../../assets/shelves/did-not-finish.png"),
    label: "Did Not Finish",
    accessibilityLabel: "Did Not Finish shelf",
    sortOrder: 4,
  },
};

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

export function sortShelfIconIds(ids: ShelfIconId[]): ShelfIconId[] {
  const order = new Map(SHELF_ICON_ORDER.map((id, index) => [id, index]));
  return [...ids].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99));
}
