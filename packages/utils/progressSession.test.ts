import { describe, expect, it } from "vitest";
import { shouldCreateProgressReadingSession } from "./progressSession";

describe("shouldCreateProgressReadingSession", () => {
  it("creates a page session when position increases", () => {
    expect(
      shouldCreateProgressReadingSession({
        format: "book",
        previousPosition: 40,
        nextPosition: 55,
      })
    ).toEqual({ create: true, kind: "pages", delta: 15 });
  });

  it("creates a listening session when position increases", () => {
    expect(
      shouldCreateProgressReadingSession({
        format: "audiobook",
        previousPosition: 600,
        nextPosition: 900,
      })
    ).toEqual({ create: true, kind: "listening", delta: 300 });
  });

  it("skips no-op progress (100 → 100)", () => {
    expect(
      shouldCreateProgressReadingSession({
        format: "book",
        previousPosition: 100,
        nextPosition: 100,
      })
    ).toEqual({ create: false, reason: "noop" });
  });

  it("skips backward progress as a correction (130 → 120)", () => {
    expect(
      shouldCreateProgressReadingSession({
        format: "book",
        previousPosition: 130,
        nextPosition: 120,
      })
    ).toEqual({ create: false, reason: "correction" });
  });
});
