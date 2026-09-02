import { describe, expect, it } from "vitest";
import { OVERVIEW_SHELF_COVER } from "./overviewShelfCover";
import {
  CURRENTLY_READING_CARD_SIZE,
  currentlyReadingCardBoxStyle,
  currentlyReadingCoverBoxStyle,
} from "./currentlyReadingCard";

describe("CURRENTLY_READING_CARD_SIZE", () => {
  it("is a full card, not a cover-only control", () => {
    const web = CURRENTLY_READING_CARD_SIZE.web;
    const native = CURRENTLY_READING_CARD_SIZE.native;

    expect(web.widthPx).toBe(220);
    expect(web.heightPx).toBe(356);
    expect(web.borderRadiusPx).toBe(12);
    expect(web.paddingPx).toBe(16);
    expect(web.heightPx).toBeGreaterThan(web.coverHeightPx);
    expect(web.widthPx).toBeGreaterThan(web.coverWidthPx);

    expect(native.widthPx).toBe(96);
    expect(native.heightPx).toBe(224);
    expect(native.borderRadiusPx).toBe(12);
    expect(native.heightPx).toBeGreaterThan(native.coverHeightPx);
  });

  it("does not reuse the 80×120 Overview shelf cover frame", () => {
    expect(CURRENTLY_READING_CARD_SIZE.web.widthPx).not.toBe(OVERVIEW_SHELF_COVER.widthPx);
    expect(CURRENTLY_READING_CARD_SIZE.web.heightPx).not.toBe(OVERVIEW_SHELF_COVER.heightPx);
    expect(CURRENTLY_READING_CARD_SIZE.native.coverWidthPx).not.toBe(OVERVIEW_SHELF_COVER.widthPx);
    expect(CURRENTLY_READING_CARD_SIZE.native.coverHeightPx).not.toBe(OVERVIEW_SHELF_COVER.heightPx);
  });

  it("keeps the plus icon proportional without filling the card", () => {
    const web = CURRENTLY_READING_CARD_SIZE.web;
    const native = CURRENTLY_READING_CARD_SIZE.native;

    expect(web.plusIconPx).toBeGreaterThanOrEqual(32);
    expect(web.plusIconPx).toBeLessThanOrEqual(40);
    expect(web.plusIconPx / web.widthPx).toBeLessThan(0.25);

    expect(native.plusIconPx).toBe(32);
    expect(native.plusIconPx / native.widthPx).toBeLessThan(0.4);
  });
});

describe("currentlyReadingCardBoxStyle", () => {
  it("exposes the shared outer footprint for book cards and Add Book", () => {
    expect(currentlyReadingCardBoxStyle("web")).toEqual({
      width: 220,
      height: 356,
      borderRadius: 12,
    });
    expect(currentlyReadingCardBoxStyle("native")).toEqual({
      width: 96,
      height: 224,
      borderRadius: 12,
    });
    expect(currentlyReadingCoverBoxStyle("web")).toEqual({ width: 112, height: 168 });
    expect(currentlyReadingCoverBoxStyle("native")).toEqual({ width: 96, height: 144 });
  });
});
