import { describe, expect, it } from "vitest";
import {
  feedComposerSearch,
  mobileComposeHref,
  parseFeedComposerPrefill,
  webFeedComposerHref,
} from "./feedComposer";

describe("feedComposer", () => {
  it("parses book and vault graphic prefill", () => {
    expect(
      parseFeedComposerPrefill({
        attachBook: " book-1 ",
        quoteGraphic: ["graphic-1"],
      })
    ).toEqual({ bookId: "book-1", quoteGraphicId: "graphic-1" });
  });

  it("builds composer hrefs without dropping the book id", () => {
    expect(webFeedComposerHref({ bookId: "abc" })).toBe("/feed/?attachBook=abc");
    expect(mobileComposeHref({ quoteGraphicId: "g1" })).toBe("/compose?quoteGraphic=g1");
    expect(feedComposerSearch({})).toBe("");
  });
});
