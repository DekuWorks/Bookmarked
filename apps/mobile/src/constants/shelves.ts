import type { ShelfStatus } from "../types";

export type ShelfSlug = "want-to-read" | "reading" | "read" | "dnf";

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
    title: "TBR",
    slug: "want-to-read",
    description: "Books waiting for you on the shelf.",
    sortOrder: 1,
    accessibilityLabel: "TBR Shelf",
  },
  {
    status: "currently_reading",
    title: "Currently Reading",
    slug: "reading",
    description: "Stories you're in the middle of right now.",
    sortOrder: 2,
    accessibilityLabel: "Currently Reading Shelf",
  },
  {
    status: "read",
    title: "Finished",
    slug: "read",
    description: "Books you've finished and shelved.",
    sortOrder: 3,
    accessibilityLabel: "Finished Shelf",
  },
  {
    status: "dnf",
    title: "DNF",
    slug: "dnf",
    description: "Books you chose not to finish.",
    sortOrder: 4,
    accessibilityLabel: "DNF Shelf",
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
