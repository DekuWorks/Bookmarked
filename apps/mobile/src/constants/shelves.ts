import type { ShelfStatus } from "../types";

export type ShelfSlug = "want-to-read" | "reading" | "read";

export const SHELF_CONFIG: {
  status: ShelfStatus;
  title: string;
  slug: ShelfSlug;
  emoji: string;
  description: string;
}[] = [
  {
    status: "want_to_read",
    title: "Want to Read",
    slug: "want-to-read",
    emoji: "📚",
    description: "Books waiting for you on the shelf.",
  },
  {
    status: "currently_reading",
    title: "Currently Reading",
    slug: "reading",
    emoji: "📖",
    description: "Stories you're in the middle of right now.",
  },
  {
    status: "read",
    title: "Read",
    slug: "read",
    emoji: "✅",
    description: "Books you've finished and shelved.",
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
