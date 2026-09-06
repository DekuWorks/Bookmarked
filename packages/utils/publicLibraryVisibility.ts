import type { ShelfStatus, ShelfVisibility } from "../types";

export function canViewerSeeShelf(input: {
  visibility: ShelfVisibility | null | undefined;
  viewerId: string | null | undefined;
  ownerId: string;
  viewerFollowsOwner: boolean;
}): boolean {
  if (input.viewerId && input.viewerId === input.ownerId) return true;
  const visibility = input.visibility ?? "public";
  if (visibility === "public") return true;
  if (visibility === "private") return false;
  return Boolean(input.viewerId && input.viewerFollowsOwner);
}

export function visibilityForBuiltInShelf(
  status: ShelfStatus,
  profile: {
    shelf_visibility_want_to_read?: ShelfVisibility | null;
    shelf_visibility_currently_reading?: ShelfVisibility | null;
    shelf_visibility_read?: ShelfVisibility | null;
    shelf_visibility_dnf?: ShelfVisibility | null;
  } | null
): ShelfVisibility {
  if (!profile) return status === "dnf" ? "private" : "public";
  switch (status) {
    case "want_to_read":
      return profile.shelf_visibility_want_to_read ?? "public";
    case "currently_reading":
      return profile.shelf_visibility_currently_reading ?? "public";
    case "read":
      return profile.shelf_visibility_read ?? "public";
    case "dnf":
      return profile.shelf_visibility_dnf ?? "private";
    default:
      return "private";
  }
}

export function filterPublicLibraryBooks<T extends { shelf_status: ShelfStatus }>(
  books: T[],
  input: {
    ownerId: string;
    viewerId: string | null | undefined;
    viewerFollowsOwner: boolean;
    profile: Parameters<typeof visibilityForBuiltInShelf>[1];
  }
): T[] {
  return books.filter((book) =>
    canViewerSeeShelf({
      visibility: visibilityForBuiltInShelf(book.shelf_status, input.profile),
      viewerId: input.viewerId,
      ownerId: input.ownerId,
      viewerFollowsOwner: input.viewerFollowsOwner,
    })
  );
}
