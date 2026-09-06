import { describe, expect, it } from "vitest";
import { shouldPromptReviewShareToFeed } from "./reviewSharePrompt";

describe("review share prompt", () => {
  it("prompts only after a new public publish", () => {
    expect(shouldPromptReviewShareToFeed({ visibility: "public", isNewPublish: true })).toBe(true);
    expect(shouldPromptReviewShareToFeed({ visibility: "private", isNewPublish: true })).toBe(
      false
    );
    expect(shouldPromptReviewShareToFeed({ visibility: "public", isNewPublish: false })).toBe(
      false
    );
  });
});
