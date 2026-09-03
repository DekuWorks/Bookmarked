import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRAIL_BOOKS_VIEW,
  TRAIL_COPY,
  parseTrailBooksView,
} from "./readingRoomTrail";

describe("parseTrailBooksView", () => {
  it("defaults to list and accepts grid", () => {
    expect(parseTrailBooksView(null)).toBe(DEFAULT_TRAIL_BOOKS_VIEW);
    expect(parseTrailBooksView("grid")).toBe("grid");
    expect(parseTrailBooksView("list")).toBe("list");
    expect(parseTrailBooksView("cards")).toBe("list");
  });
});

describe("TRAIL_COPY", () => {
  it("uses Title Case for the session notes screen", () => {
    expect(TRAIL_COPY.sessionNotes).toBe("Session Notes");
    expect(TRAIL_COPY.backToTrail).toBe("← Trail");
  });
});
