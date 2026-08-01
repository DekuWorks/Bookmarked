import type { Profile, ShelfStatus } from "@/types";
import type { ShelfVisibility } from "@/types";

const DEFAULT_VISIBILITY: ShelfVisibility = "public";

export function getShelfVisibility(
  profile: Profile | null | undefined,
  status: ShelfStatus
): ShelfVisibility {
  if (!profile) return DEFAULT_VISIBILITY;

  switch (status) {
    case "want_to_read":
      return profile.shelf_visibility_want_to_read ?? DEFAULT_VISIBILITY;
    case "currently_reading":
      return profile.shelf_visibility_currently_reading ?? DEFAULT_VISIBILITY;
    case "read":
      return profile.shelf_visibility_read ?? DEFAULT_VISIBILITY;
    case "dnf":
      return profile.shelf_visibility_dnf ?? "private";
    default:
      return DEFAULT_VISIBILITY;
  }
}

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

export const SHELF_VISIBILITY_OPTIONS: { value: ShelfVisibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "followers", label: "Followers only" },
  { value: "private", label: "Private" },
];

export function profileShelfVisibilityDefaults(): Pick<
  Profile,
  | "shelf_visibility_want_to_read"
  | "shelf_visibility_currently_reading"
  | "shelf_visibility_read"
  | "shelf_visibility_dnf"
> {
  return {
    shelf_visibility_want_to_read: "public",
    shelf_visibility_currently_reading: "public",
    shelf_visibility_read: "public",
    shelf_visibility_dnf: "private",
  };
}
