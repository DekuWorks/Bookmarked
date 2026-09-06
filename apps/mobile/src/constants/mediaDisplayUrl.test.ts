import { describe, expect, it } from "vitest";
import {
  resolveCoverDisplayUrl,
  resolveFeedImageLoading,
  resolveGiphyInlineSource,
} from "../../../../packages/utils/mediaDisplayUrl";

describe("media display URLs (iOS)", () => {
  it("eager-loads the first Feed image", () => {
    expect(resolveFeedImageLoading(true)).toBe("eager");
  });

  it("uses Open Library medium thumbs", () => {
    expect(
      resolveCoverDisplayUrl("https://covers.openlibrary.org/b/id/8231856-L.jpg", "thumb")
    ).toBe("https://covers.openlibrary.org/b/id/8231856-M.jpg");
  });

  it("uses a downsized Giphy file for inline animation", () => {
    expect(
      resolveGiphyInlineSource("https://media.giphy.com/media/abc123/giphy.gif").displayUrl
    ).toBe("https://media.giphy.com/media/abc123/giphy-downsized.gif");
  });
});
