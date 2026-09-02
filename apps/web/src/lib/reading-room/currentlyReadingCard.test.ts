import { describe, expect, it } from "vitest";
import {
  CURRENTLY_READING_CARD_SIZE,
  currentlyReadingCardBoxStyle,
} from "@bookmarked/utils/currentlyReadingCard";
import { READING_ROOM_SECTION_HEADING_CLASS } from "./sectionHeading";

describe("currently reading card size (web)", () => {
  it("matches the shared web card footprint used by book cards and Add Book", () => {
    expect(currentlyReadingCardBoxStyle("web")).toEqual({
      width: CURRENTLY_READING_CARD_SIZE.web.widthPx,
      height: CURRENTLY_READING_CARD_SIZE.web.heightPx,
      borderRadius: CURRENTLY_READING_CARD_SIZE.web.borderRadiusPx,
    });
    expect(CURRENTLY_READING_CARD_SIZE.web.heightPx).toBeGreaterThan(
      CURRENTLY_READING_CARD_SIZE.web.coverHeightPx
    );
  });
});

describe("Overview section heading", () => {
  it("reuses the puce-red section title token for Recent Activity", () => {
    expect(READING_ROOM_SECTION_HEADING_CLASS).toBe(
      "text-lg font-semibold text-puce-red md:text-xl"
    );
    expect(READING_ROOM_SECTION_HEADING_CLASS).not.toContain("text-text");
  });
});
