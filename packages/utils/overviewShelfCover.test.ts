import { describe, expect, it } from "vitest";
import {
  OVERVIEW_SHELF_COVER,
  OVERVIEW_SHELF_COVER_ASPECT_RATIO,
  OVERVIEW_SHELF_COVER_FRAME_CLASS,
  OVERVIEW_SHELF_TABLET_MIN_PX,
  isPortraitCoverFrame,
  overviewShelfCoverBoxStyle,
  overviewShelfCoverFrame,
} from "./overviewShelfCover";

describe("OVERVIEW_SHELF_COVER", () => {
  it("uses a 2:3 portrait frame large enough to read", () => {
    expect(OVERVIEW_SHELF_COVER.aspectRatio).toBeCloseTo(2 / 3, 6);
    expect(OVERVIEW_SHELF_COVER.aspectRatio).toBe(OVERVIEW_SHELF_COVER_ASPECT_RATIO);
    expect(OVERVIEW_SHELF_COVER.widthPx).toBeGreaterThanOrEqual(80);
    expect(OVERVIEW_SHELF_COVER.heightPx / OVERVIEW_SHELF_COVER.widthPx).toBeCloseTo(
      3 / 2,
      6
    );
    expect(isPortraitCoverFrame(OVERVIEW_SHELF_COVER.widthPx, OVERVIEW_SHELF_COVER.heightPx)).toBe(
      true
    );
  });

  it("contains artwork instead of cropping it", () => {
    expect(OVERVIEW_SHELF_COVER.fit).toBe("contain");
  });
});

describe("overviewShelfCoverFrame", () => {
  it("derives height from width at 2:3", () => {
    expect(overviewShelfCoverFrame(80)).toEqual({
      width: 80,
      height: 120,
      aspectRatio: 2 / 3,
    });
    expect(overviewShelfCoverBoxStyle()).toEqual({ width: 80, height: 120 });
    expect(overviewShelfCoverBoxStyle(OVERVIEW_SHELF_TABLET_MIN_PX - 1)).toEqual({
      width: 80,
      height: 120,
    });
    expect(overviewShelfCoverBoxStyle(OVERVIEW_SHELF_TABLET_MIN_PX)).toEqual({
      width: 96,
      height: 144,
    });
    expect(OVERVIEW_SHELF_COVER.tabletWidthPx).toBe(96);
    expect(OVERVIEW_SHELF_COVER.tabletHeightPx).toBe(144);
    expect(OVERVIEW_SHELF_COVER.tabletWidthPx / OVERVIEW_SHELF_COVER.widthPx).toBeLessThan(1.5);
  });

  it("uses one visible portrait frame on web", () => {
    expect(OVERVIEW_SHELF_COVER_FRAME_CLASS).toContain("w-20");
    expect(OVERVIEW_SHELF_COVER_FRAME_CLASS).toContain("md:w-24");
    expect(OVERVIEW_SHELF_COVER_FRAME_CLASS).toContain("overflow-visible");
    expect(OVERVIEW_SHELF_COVER_FRAME_CLASS).not.toContain("overflow-hidden");
    expect(OVERVIEW_SHELF_COVER_FRAME_CLASS).not.toContain("h-");
  });

  it("never produces a landscape thumbnail", () => {
    const frame = overviewShelfCoverFrame();
    expect(isPortraitCoverFrame(frame.width, frame.height)).toBe(true);
    expect(isPortraitCoverFrame(120, 80)).toBe(false);
  });
});
