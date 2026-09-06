import { describe, expect, it } from "vitest";
import { canViewerSeeShelf, filterPublicLibraryBooks } from "./publicLibraryVisibility";

describe("public library visibility", () => {
  it("hides private shelves from other readers", () => {
    expect(
      canViewerSeeShelf({
        visibility: "private",
        viewerId: "viewer",
        ownerId: "owner",
        viewerFollowsOwner: true,
      })
    ).toBe(false);
    expect(
      canViewerSeeShelf({
        visibility: "followers",
        viewerId: "viewer",
        ownerId: "owner",
        viewerFollowsOwner: true,
      })
    ).toBe(true);
  });

  it("keeps DNF private by default for visitors", () => {
    const visible = filterPublicLibraryBooks(
      [
        { shelf_status: "read" as const, id: "1" },
        { shelf_status: "dnf" as const, id: "2" },
      ],
      {
        ownerId: "owner",
        viewerId: "viewer",
        viewerFollowsOwner: false,
        profile: {
          shelf_visibility_read: "public",
          shelf_visibility_dnf: "private",
        },
      }
    );
    expect(visible.map((book) => book.id)).toEqual(["1"]);
  });
});
