import { describe, expect, it } from "vitest";
import { shouldCreateProgressReadingSession } from "../../../../../packages/utils/progressSession";

describe("web progress session gate", () => {
  it("matches the canonical no-op / correction / forward rules", () => {
    expect(
      shouldCreateProgressReadingSession({
        format: "book",
        previousPosition: 100,
        nextPosition: 100,
      }).create
    ).toBe(false);
    expect(
      shouldCreateProgressReadingSession({
        format: "book",
        previousPosition: 130,
        nextPosition: 120,
      }).create
    ).toBe(false);
    expect(
      shouldCreateProgressReadingSession({
        format: "book",
        previousPosition: 40,
        nextPosition: 55,
      })
    ).toEqual({ create: true, kind: "pages", delta: 15 });
  });
});
