import { describe, expect, it } from "vitest";
import {
  FEED_IMAGE_MEDIA,
  feedImageOrientation,
  layoutFeedImageMedia,
  resolveFeedImageAspectRatio,
  resolveFeedImageMaxHeight,
  resolveFeedImageMaxWidth,
} from "./feedImageMedia";

describe("FEED_IMAGE_MEDIA", () => {
  it("contains artwork and uses one ratio token for every breakpoint", () => {
    expect(FEED_IMAGE_MEDIA.fit).toBe("contain");
    expect(FEED_IMAGE_MEDIA.maxHeightPx).toBe(480);
    expect(FEED_IMAGE_MEDIA.compactMaxHeightPx).toBe(280);
    expect(FEED_IMAGE_MEDIA.maxMediaWidthPx).toBe(640);
    expect(FEED_IMAGE_MEDIA.fallbackAspectRatio).toBeCloseTo(4 / 3, 6);
  });
});

describe("resolveFeedImageAspectRatio", () => {
  it("returns width / height when both sides are positive", () => {
    expect(resolveFeedImageAspectRatio(1200, 800)).toBeCloseTo(1.5, 6);
    expect(resolveFeedImageAspectRatio(800, 1200)).toBeCloseTo(2 / 3, 6);
    expect(resolveFeedImageAspectRatio(600, 600)).toBe(1);
  });

  it("rejects missing or invalid measurements", () => {
    expect(resolveFeedImageAspectRatio(null, 800)).toBeNull();
    expect(resolveFeedImageAspectRatio(800, 0)).toBeNull();
    expect(resolveFeedImageAspectRatio(-10, 20)).toBeNull();
  });
});

describe("feedImageOrientation", () => {
  it("keeps portrait, landscape, and square distinct", () => {
    expect(feedImageOrientation(2 / 3)).toBe("portrait");
    expect(feedImageOrientation(16 / 9)).toBe("landscape");
    expect(feedImageOrientation(1)).toBe("square");
  });
});

describe("resolveFeedImageMaxHeight", () => {
  it("uses the token unless the viewport is shorter", () => {
    expect(resolveFeedImageMaxHeight({ viewportHeight: 900 })).toBe(
      FEED_IMAGE_MEDIA.maxHeightPx
    );
    expect(resolveFeedImageMaxHeight({ compact: true, viewportHeight: 900 })).toBe(
      FEED_IMAGE_MEDIA.compactMaxHeightPx
    );
    expect(resolveFeedImageMaxHeight({ viewportHeight: 500 })).toBe(350);
  });
});

describe("layoutFeedImageMedia", () => {
  it("sizes landscape to the post width with auto height", () => {
    const layout = layoutFeedImageMedia({
      containerWidth: 400,
      maxHeight: 480,
      naturalWidth: 1600,
      naturalHeight: 900,
    });
    expect(layout.orientation).toBe("landscape");
    expect(layout.fit).toBe("contain");
    expect(layout.width).toBe(400);
    expect(layout.height).toBeCloseTo(400 / (1600 / 900), 4);
    expect(layout.narrowedByMaxHeight).toBe(false);
    expect(layout.offsetX).toBe(0);
  });

  it("keeps a square 1:1", () => {
    const layout = layoutFeedImageMedia({
      containerWidth: 400,
      maxHeight: 480,
      naturalWidth: 800,
      naturalHeight: 800,
    });
    expect(layout.orientation).toBe("square");
    expect(layout.width).toBe(400);
    expect(layout.height).toBe(400);
  });

  it("narrows a tall portrait to the max height and centers it", () => {
    const layout = layoutFeedImageMedia({
      containerWidth: 400,
      maxHeight: 480,
      naturalWidth: 800,
      naturalHeight: 1600,
    });
    expect(layout.orientation).toBe("portrait");
    expect(layout.height).toBe(480);
    expect(layout.width).toBe(240);
    expect(layout.narrowedByMaxHeight).toBe(true);
    expect(layout.offsetX).toBe(80);
    expect(layout.fit).toBe("contain");
  });

  it("scales a panoramic image to the post width without horizontal overflow", () => {
    const layout = layoutFeedImageMedia({
      containerWidth: 400,
      maxHeight: 480,
      naturalWidth: 3000,
      naturalHeight: 400,
    });
    expect(layout.orientation).toBe("landscape");
    expect(layout.width).toBe(400);
    expect(layout.height).toBeCloseTo(400 / 7.5, 4);
    expect(layout.narrowedByMaxHeight).toBe(false);
  });

  it("does not stretch a tiny image to the full column", () => {
    const layout = layoutFeedImageMedia({
      containerWidth: 400,
      maxHeight: 480,
      naturalWidth: 80,
      naturalHeight: 80,
    });
    expect(layout.width).toBe(80);
    expect(layout.height).toBe(80);
    expect(layout.offsetX).toBe(160);
  });

  it("caps a very wide column at maxMediaWidth with the same proportions", () => {
    const layout = layoutFeedImageMedia({
      containerWidth: 900,
      maxHeight: 480,
      naturalWidth: 2000,
      naturalHeight: 1000,
    });
    expect(resolveFeedImageMaxWidth(900)).toBe(FEED_IMAGE_MEDIA.maxMediaWidthPx);
    expect(layout.width).toBe(640);
    expect(layout.height).toBe(320);
    expect(layout.offsetX).toBe(130);
  });

  it("uses the same ratio on a 320-wide phone and a 900-wide desktop", () => {
    const source = { naturalWidth: 1200, naturalHeight: 1800, maxHeight: 480 };
    const phone = layoutFeedImageMedia({ containerWidth: 320, ...source });
    const desktop = layoutFeedImageMedia({ containerWidth: 900, ...source });
    expect(phone.aspectRatio).toBeCloseTo(desktop.aspectRatio, 6);
    expect(phone.aspectRatio).toBeCloseTo(2 / 3, 6);
    expect(phone.orientation).toBe("portrait");
    expect(desktop.orientation).toBe("portrait");
  });

  it("reserves a 4:3 box when dimensions are unknown", () => {
    const layout = layoutFeedImageMedia({
      containerWidth: 400,
      maxHeight: 480,
    });
    expect(layout.reserved).toBe(true);
    expect(layout.aspectRatio).toBeCloseTo(4 / 3, 6);
    expect(layout.width).toBe(400);
    expect(layout.height).toBeCloseTo(300, 4);
  });

  it("uses cover only when crop metadata says so", () => {
    const contain = layoutFeedImageMedia({
      containerWidth: 400,
      maxHeight: 480,
      naturalWidth: 800,
      naturalHeight: 1600,
    });
    const cover = layoutFeedImageMedia({
      containerWidth: 400,
      maxHeight: 480,
      naturalWidth: 800,
      naturalHeight: 1600,
      crop: { mode: "cover" },
    });
    expect(contain.fit).toBe("contain");
    expect(cover.fit).toBe("cover");
    expect(cover.width).toBe(contain.width);
    expect(cover.height).toBe(contain.height);
  });
});
