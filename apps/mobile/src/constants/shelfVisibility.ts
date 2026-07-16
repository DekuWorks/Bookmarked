import type { ShelfVisibility } from "../types";

export const SHELF_VISIBILITY_OPTIONS: { value: ShelfVisibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "followers", label: "Followers only" },
  { value: "private", label: "Private" },
];

export function shelfVisibilityLabel(visibility: ShelfVisibility): string {
  switch (visibility) {
    case "public":
      return "Public";
    case "followers":
      return "Followers only";
    case "private":
      return "Private";
  }
}
