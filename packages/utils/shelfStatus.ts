import type { ShelfStatus } from "../types";

/** Built-in shelves that count toward finished / pages-read / yearly goals. */
export function countsTowardFinishedStats(book: {
  shelf_status: string;
  dnf?: boolean | null;
}): boolean {
  return book.shelf_status === "read" && !book.dnf;
}

export type UserBookShelfPatch = {
  shelf_status: ShelfStatus;
  dnf: boolean;
  updated_at: string;
  started_at?: string;
  finished_at?: null;
};

/**
 * Patch applied when moving a library book between built-in shelves.
 * Updates the existing `user_books` row — never duplicates, never clears
 * progress/sessions/notes. DNF clears `finished_at` so the book cannot
 * remain marked finished while on the DNF shelf.
 */
export function buildUserBookShelfPatch(input: {
  shelfStatus: ShelfStatus;
  existingStartedAt?: string | null;
  now?: string;
}): UserBookShelfPatch {
  const now = input.now ?? new Date().toISOString();
  const patch: UserBookShelfPatch = {
    shelf_status: input.shelfStatus,
    dnf: input.shelfStatus === "dnf",
    updated_at: now,
  };

  if (input.shelfStatus === "currently_reading" && !input.existingStartedAt) {
    patch.started_at = now;
  }

  if (input.shelfStatus === "dnf") {
    patch.finished_at = null;
  }

  return patch;
}

export function isBuiltInShelfStatus(value: string): value is ShelfStatus {
  return (
    value === "want_to_read" ||
    value === "currently_reading" ||
    value === "read" ||
    value === "dnf"
  );
}
