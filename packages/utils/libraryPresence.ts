import { CUSTOM_COLLECTIONS_HEADING, DEFAULT_SHELF_ICON_LABEL } from "./shelfIcons";
import { isBuiltInShelfStatus } from "./shelfStatus";

export type LibraryPresenceKind = "default" | "custom" | "none";

export type LibraryPresenceInput = {
  defaultShelf?: string | null;
  customShelfIds?: readonly string[] | null;
  customShelfCount?: number;
  customCollectionNames?: readonly string[] | null;
};

export type LibraryPresenceDescription = {
  kind: LibraryPresenceKind;
  label: string;
};

function customMembershipCount(input: LibraryPresenceInput): number {
  if (typeof input.customShelfCount === "number") return input.customShelfCount;
  if (input.customShelfIds) return input.customShelfIds.length;
  if (input.customCollectionNames) {
    return input.customCollectionNames.filter((name) => name.trim().length > 0).length;
  }
  return 0;
}

function trimmedCustomNames(input: LibraryPresenceInput): string[] {
  return (input.customCollectionNames ?? [])
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/** True when the book is on a built-in shelf or in at least one custom collection. */
export function hasLibraryPresence(input: LibraryPresenceInput): boolean {
  return describeLibraryPresence(input).kind !== "none";
}

/**
 * Status copy for Book Details.
 * Default shelf wins. Custom-only membership is still “on your shelves”.
 */
export function describeLibraryPresence(
  input: LibraryPresenceInput
): LibraryPresenceDescription {
  const shelf = input.defaultShelf;
  if (shelf && isBuiltInShelfStatus(shelf)) {
    return { kind: "default", label: DEFAULT_SHELF_ICON_LABEL[shelf] };
  }

  const names = trimmedCustomNames(input);
  if (names.length === 1) {
    return { kind: "custom", label: names[0] };
  }
  if (names.length > 1 || customMembershipCount(input) > 0) {
    return { kind: "custom", label: CUSTOM_COLLECTIONS_HEADING };
  }

  return { kind: "none", label: "Not on your shelves yet." };
}
