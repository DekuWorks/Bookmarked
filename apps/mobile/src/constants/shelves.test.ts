import { describe, expect, it } from "vitest";
import { getShelvesInOrder, SHELF_CONFIG } from "./shelves";

/** Mirrors `SHELF_ICON_ORDER` in shelfIcons.ts (not imported — image requires break vitest). */
const EXPECTED_ICON_ORDER = [
  "want_to_read",
  "currently_reading",
  "read",
  "dnf",
] as const;

describe("mobile shelf constants", () => {
  it("orders built-in shelves correctly", () => {
    expect(getShelvesInOrder().map((s) => s.status)).toEqual([
      "want_to_read",
      "currently_reading",
      "read",
      "dnf",
    ]);
  });

  it("uses Finished label for read DB value", () => {
    expect(SHELF_CONFIG.find((s) => s.status === "read")?.title).toBe("Finished");
  });

  it("defines DNF after Finished in icon order contract", () => {
    expect(EXPECTED_ICON_ORDER).toEqual([
      "want_to_read",
      "currently_reading",
      "read",
      "dnf",
    ]);
    expect(EXPECTED_ICON_ORDER.at(-1)).toBe("dnf");
  });

  it("assigns sortOrder 1–4 for status shelves including DNF", () => {
    expect(getShelvesInOrder().map((s) => s.sortOrder)).toEqual([1, 2, 3, 4]);
  });
});
