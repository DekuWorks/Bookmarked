import type { ShelfStatus } from "../types";

export type ShelfSlug = "want-to-read" | "reading" | "read";

export const SHELF_CONFIG: {
  status: ShelfStatus;
  title: string;
  slug: ShelfSlug;
  description: string;
  sortOrder: number;
  accessibilityLabel: string;
}[] = [
  {
    status: "want_to_read",
    title: "Want to Read",
    slug: "want-to-read",
    description: "Books waiting for you on the shelf.",
    sortOrder: 1,
    accessibilityLabel: "Want to Read shelf",
  },
  {
    status: "currently_reading",
    title: "Currently Reading",
    slug: "reading",
    description: "Stories you're in the middle of right now.",
    sortOrder: 2,
    accessibilityLabel: "Currently Reading shelf",
  },
  {
    status: "read",
    title: "Finished",
    slug: "read",
    description: "Books you've finished and shelved.",
    sortOrder: 3,
    accessibilityLabel: "Finished shelf",
  },
];

export function shelfSlugToStatus(slug: string): ShelfStatus | null {
  return SHELF_CONFIG.find((s) => s.slug === slug)?.status ?? null;
}

export function shelfStatusToSlug(status: ShelfStatus): ShelfSlug {
  return SHELF_CONFIG.find((s) => s.status === status)?.slug ?? "want-to-read";
}

export function getShelfConfig(status: ShelfStatus) {
  return SHELF_CONFIG.find((s) => s.status === status)!;
}

export function getShelfConfigBySlug(slug: string) {
  return SHELF_CONFIG.find((s) => s.slug === slug) ?? null;
}

export function getShelvesInOrder() {
  return [...SHELF_CONFIG].sort((a, b) => a.sortOrder - b.sortOrder);
}
