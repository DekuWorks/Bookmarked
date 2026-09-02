import { describe, expect, it } from "vitest";
import {
  CURRENTLY_READING_CARD_SIZE,
  currentlyReadingCardBoxStyle,
} from "../../../../packages/utils/currentlyReadingCard";

describe("currently reading card size (iOS)", () => {
  it("matches the shared native card footprint used by CoverTile and Add Book", () => {
    expect(currentlyReadingCardBoxStyle("native")).toEqual({
      width: CURRENTLY_READING_CARD_SIZE.native.widthPx,
      height: CURRENTLY_READING_CARD_SIZE.native.heightPx,
      borderRadius: CURRENTLY_READING_CARD_SIZE.native.borderRadiusPx,
    });
    expect(CURRENTLY_READING_CARD_SIZE.native.heightPx).toBeGreaterThan(
      CURRENTLY_READING_CARD_SIZE.native.coverHeightPx
    );
  });
});
