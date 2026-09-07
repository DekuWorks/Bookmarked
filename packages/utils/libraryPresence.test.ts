import { describe, expect, it } from "vitest";
import { CUSTOM_COLLECTIONS_HEADING } from "./shelfIcons";
import { describeLibraryPresence, hasLibraryPresence } from "./libraryPresence";

describe("hasLibraryPresence", () => {
  it("is true for a built-in default shelf", () => {
    expect(hasLibraryPresence({ defaultShelf: "read" })).toBe(true);
    expect(hasLibraryPresence({ defaultShelf: "currently_reading" })).toBe(true);
  });

  it("is true for custom-collection membership with no default shelf", () => {
    expect(hasLibraryPresence({ customShelfIds: ["shelf-1"] })).toBe(true);
    expect(hasLibraryPresence({ customShelfCount: 2 })).toBe(true);
    expect(hasLibraryPresence({ customCollectionNames: ["Summer"] })).toBe(true);
  });

  it("is false when there is no default shelf and no custom membership", () => {
    expect(hasLibraryPresence({})).toBe(false);
    expect(hasLibraryPresence({ defaultShelf: null, customShelfIds: [] })).toBe(false);
    expect(hasLibraryPresence({ defaultShelf: "custom" })).toBe(false);
  });
});

describe("describeLibraryPresence", () => {
  it("prefers the default shelf label over custom collections", () => {
    expect(
      describeLibraryPresence({
        defaultShelf: "read",
        customCollectionNames: ["Summer Reads"],
      })
    ).toEqual({ kind: "default", label: "Finished" });
  });

  it("keeps Finished when the book is also in a custom collection", () => {
    expect(
      hasLibraryPresence({
        defaultShelf: "read",
        customCollectionNames: ["Smut"],
      })
    ).toBe(true);
    expect(
      describeLibraryPresence({
        defaultShelf: "read",
        customShelfIds: ["smut"],
        customCollectionNames: ["Smut"],
      })
    ).toEqual({ kind: "default", label: "Finished" });
  });

  it("uses the collection name when that is the only library presence", () => {
    expect(
      describeLibraryPresence({
        defaultShelf: null,
        customCollectionNames: ["Dagger Club"],
      })
    ).toEqual({ kind: "custom", label: "Dagger Club" });
  });

  it("uses Custom Collections for multiple memberships or ids without names", () => {
    expect(
      describeLibraryPresence({
        customCollectionNames: ["A", "B"],
      })
    ).toEqual({ kind: "custom", label: CUSTOM_COLLECTIONS_HEADING });
    expect(
      describeLibraryPresence({
        customShelfIds: ["s1"],
      })
    ).toEqual({ kind: "custom", label: CUSTOM_COLLECTIONS_HEADING });
  });

  it("says not on shelves only when there is no library presence", () => {
    expect(describeLibraryPresence({})).toEqual({
      kind: "none",
      label: "Not on your shelves yet.",
    });
  });
});
