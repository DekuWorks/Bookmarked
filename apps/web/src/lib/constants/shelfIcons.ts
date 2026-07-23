import type { ShelfStatus } from "@/types";

/** Built-in shelf icon keys — matches DB shelf_status values plus DNF flag. */
export type ShelfIconId = ShelfStatus | "dnf";

export type ShelfIconSize = "small" | "medium" | "large";

/** Pixel sizes per spec: small 24–32, medium 48–72, large 96–160 (object-fit contain). */
export const SHELF_ICON_SIZE_PX: Record<ShelfIconSize, number> = {
  small: 28,
  medium: 56,
  large: 128,
};

export const SHELF_ICON_FRAME_PX: Record<ShelfIconSize, number> = {
  small: 32,
  medium: 64,
  large: 144,
};

export type ShelfIconConfig = {
  id: ShelfIconId;
  /** Public path under /assets/shelves/ */
  src: string;
  label: string;
  accessibilityLabel: string;
  sortOrder: number;
};

/** Product order: Want to Read → Currently Reading → Finished → Did Not Finish */
export const SHELF_ICON_ORDER: ShelfIconId[] = [
  "want_to_read",
  "currently_reading",
  "read",
  "dnf",
];

export const SHELF_ICONS: Record<ShelfIconId, ShelfIconConfig> = {
  want_to_read: {
    id: "want_to_read",
    src: "/assets/shelves/want-to-read.png",
    label: "Want to Read",
    accessibilityLabel: "Want to Read shelf",
    sortOrder: 1,
  },
  currently_reading: {
    id: "currently_reading",
    src: "/assets/shelves/currently-reading.png",
    label: "Currently Reading",
    accessibilityLabel: "Currently Reading shelf",
    sortOrder: 2,
  },
  read: {
    id: "read",
    src: "/assets/shelves/finished.png",
    label: "Finished",
    accessibilityLabel: "Finished shelf",
    sortOrder: 3,
  },
  dnf: {
    id: "dnf",
    src: "/assets/shelves/did-not-finish.png",
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

/** Ensures built-in shelves render in product order regardless of input order. */
export function sortShelfIconIds(ids: ShelfIconId[]): ShelfIconId[] {
  const order = new Map(SHELF_ICON_ORDER.map((id, index) => [id, index]));
  return [...ids].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99));
}
