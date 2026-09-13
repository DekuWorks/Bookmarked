import { describe, expect, it } from "vitest";
import { withOptionalCaption } from "./feedSharePreview";

describe("withOptionalCaption", () => {
  it("returns body alone when caption is empty", () => {
    expect(withOptionalCaption("Review text", "  ")).toBe("Review text");
  });

  it("prefixes caption for Feed share drafts", () => {
    expect(withOptionalCaption("Review text", "Loved it")).toBe("Loved it\n\nReview text");
  });
});
