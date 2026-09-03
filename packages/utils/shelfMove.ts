import type { ShelfStatus } from "../types";
import { isBuiltInShelfStatus } from "./shelfStatus";

/** Unified move destination: built-in shelf or custom collection. */
export type ShelfMoveDestination =
  | { kind: "builtin"; status: ShelfStatus }
  | { kind: "custom"; shelfId: string };

export const ALREADY_IN_LIBRARY_COPY = {
  title: "Already in Library",
  message: "This book is already in your Library. Do you still want to add it?",
  continue: "Continue",
  cancel: "Cancel",
} as const;

/** Built-in + custom labels for the already-in-library warning. */
export function formatLibraryMemberships(
  builtinLabel: string | null | undefined,
  customNames: string[]
): string {
  const labels = [
    ...(builtinLabel?.trim() ? [builtinLabel.trim()] : []),
    ...customNames.map((name) => name.trim()).filter(Boolean),
  ];
  if (labels.length === 0) return "";
  return `Currently on: ${labels.join(", ")}`;
}

export function parseShelfMoveDestination(
  value: { kind?: string; status?: string; shelfId?: string } | null | undefined
): ShelfMoveDestination | null {
  if (!value) return null;
  if (value.kind === "custom" && value.shelfId?.trim()) {
    return { kind: "custom", shelfId: value.shelfId.trim() };
  }
  if (value.kind === "builtin" && value.status && isBuiltInShelfStatus(value.status)) {
    return { kind: "builtin", status: value.status };
  }
  return null;
}

/**
 * Moving never deletes the user_books row. Built-in destinations update
 * shelf_status on the existing row. Custom destinations add membership only.
 */
export function shelfMovePreservesUserBook(_destination: ShelfMoveDestination): true {
  return true;
}
