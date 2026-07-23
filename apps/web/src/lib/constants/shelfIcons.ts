import type { ShelfStatus } from "@/types";

/** Built-in shelf icon keys — matches DB shelf_status values plus DNF. */
export type ShelfIconId = ShelfStatus | "dnf";

export type ShelfIconConfig = {
  id: ShelfIconId;
  /** Public path under /images/shelves/ */
  src: string;
  label: string;
};

/** Product order: Want to Read → Currently Reading → Read → DNF */
export const SHELF_ICON_ORDER: ShelfIconId[] = [
  "want_to_read",
  "currently_reading",
  "read",
  "dnf",
];

export const SHELF_ICONS: Record<ShelfIconId, ShelfIconConfig> = {
  want_to_read: {
    id: "want_to_read",
    src: "/images/shelves/want-to-read.png",
    label: "Want to Read",
  },
  currently_reading: {
    id: "currently_reading",
    src: "/images/shelves/currently-reading.png",
    label: "Currently Reading",
  },
  read: {
    id: "read",
    src: "/images/shelves/read.png",
    label: "Read",
  },
  dnf: {
    id: "dnf",
    src: "/images/shelves/dnf.png",
    label: "Did Not Finish",
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
