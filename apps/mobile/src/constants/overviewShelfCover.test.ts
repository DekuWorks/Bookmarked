import { describe, expect, it } from "vitest";
import {
  OVERVIEW_SHELF_COVER,
  isPortraitCoverFrame,
  overviewShelfCoverBoxStyle,
} from "../../../../packages/utils/overviewShelfCover";

describe("overview shelf covers (iOS)", () => {
  it("matches the shared portrait contain frame used on web", () => {
    expect(OVERVIEW_SHELF_COVER.fit).toBe("contain");
    expect(overviewShelfCoverBoxStyle()).toEqual({ width: 80, height: 120 });
    expect(isPortraitCoverFrame(80, 120)).toBe(true);
  });
});
