import { describe, expect, it } from "vitest";
import {
  clampDiscoveryTags,
  discoveryReviewState,
  discoveryReviewSummaryLabel,
} from "./discoveryCard";

describe("discoveryReviewState", () => {
  it("maps rating/written combinations", () => {
    expect(discoveryReviewState({ hasRating: false, hasWrittenReview: false })).toBe("none");
    expect(discoveryReviewState({ hasRating: true, hasWrittenReview: false })).toBe("rating_only");
    expect(discoveryReviewState({ hasRating: false, hasWrittenReview: true })).toBe("written_only");
    expect(discoveryReviewState({ hasRating: true, hasWrittenReview: true })).toBe("both");
  });
});

describe("discoveryReviewSummaryLabel", () => {
  it("returns stable empty-state copy", () => {
    expect(discoveryReviewSummaryLabel("none")).toBe("No review yet");
    expect(discoveryReviewSummaryLabel("rating_only")).toBe("Rating only");
    expect(discoveryReviewSummaryLabel("written_only")).toBe("Written review available");
    expect(discoveryReviewSummaryLabel("both")).toBe("Written review available");
  });
});

describe("clampDiscoveryTags", () => {
  it("trims and limits tags", () => {
    expect(clampDiscoveryTags(["  a ", "", "b", "c"], 2)).toEqual(["a", "b"]);
    expect(clampDiscoveryTags(null)).toEqual([]);
  });
});
