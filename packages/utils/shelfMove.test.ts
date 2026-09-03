import { describe, expect, it } from "vitest";
import {
  ALREADY_IN_LIBRARY_COPY,
  formatLibraryMemberships,
  parseShelfMoveDestination,
  shelfMovePreservesUserBook,
} from "./shelfMove";

describe("shelfMove", () => {
  it("parses built-in and custom destinations", () => {
    expect(parseShelfMoveDestination({ kind: "builtin", status: "read" })).toEqual({
      kind: "builtin",
      status: "read",
    });
    expect(parseShelfMoveDestination({ kind: "custom", shelfId: "abc" })).toEqual({
      kind: "custom",
      shelfId: "abc",
    });
    expect(parseShelfMoveDestination({ kind: "builtin", status: "nope" })).toBeNull();
  });

  it("never treats a move as a delete+readd", () => {
    expect(
      shelfMovePreservesUserBook({ kind: "builtin", status: "want_to_read" })
    ).toBe(true);
    expect(shelfMovePreservesUserBook({ kind: "custom", shelfId: "s1" })).toBe(true);
  });

  it("keeps the already-in-library warning copy", () => {
    expect(ALREADY_IN_LIBRARY_COPY.message).toContain("already in your Library");
  });

  it("lists built-in and custom memberships together", () => {
    expect(formatLibraryMemberships("TBR", ["Summer", "Book Club"])).toBe(
      "Currently on: TBR, Summer, Book Club"
    );
    expect(formatLibraryMemberships(null, [])).toBe("");
  });
});
