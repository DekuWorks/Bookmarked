import { describe, expect, it } from "vitest";
import {
  FEED_IMAGE_MEDIA,
  layoutFeedImageMedia,
} from "../../../../packages/utils/feedImageMedia";

describe("feed image media (iOS)", () => {
  it("matches the shared contain rules used on web", () => {
    expect(FEED_IMAGE_MEDIA.fit).toBe("contain");
    expect(FEED_IMAGE_MEDIA.maxHeightPx).toBe(480);
    expect(FEED_IMAGE_MEDIA.maxMediaWidthPx).toBe(640);

    const portrait = layoutFeedImageMedia({
      containerWidth: 360,
      maxHeight: 480,
      naturalWidth: 800,
      naturalHeight: 1600,
    });
    expect(portrait.narrowedByMaxHeight).toBe(true);
    expect(portrait.width).toBe(240);
    expect(portrait.height).toBe(480);
    expect(portrait.offsetX).toBe(60);
    expect(portrait.fit).toBe("contain");
  });
});
