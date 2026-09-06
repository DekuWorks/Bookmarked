import { describe, expect, it } from "vitest";
import {
  PRIVATE_REVIEW_BADGE,
  PRIVATE_REVIEWS_EMPTY_COPY,
  REVIEW_VISIBILITY_OPTIONS,
  canViewerReadReview,
  isPrivateReview,
  isPublicReview,
  isReviewPubliclyVisible,
  parseReviewAudience,
  reviewActivityVisibility,
} from "./reviewVisibility";

describe("parseReviewAudience", () => {
  it("defaults unknown and legacy values to public", () => {
    expect(parseReviewAudience("public")).toBe("public");
    expect(parseReviewAudience("followers")).toBe("public");
    expect(parseReviewAudience(null)).toBe("public");
    expect(parseReviewAudience(undefined)).toBe("public");
    expect(parseReviewAudience("private")).toBe("private");
  });
});

describe("review visibility helpers", () => {
  it("detects private vs public without dropping spoiler metadata", () => {
    expect(isPrivateReview("private")).toBe(true);
    expect(isPublicReview("private")).toBe(false);
    expect(isReviewPubliclyVisible("private")).toBe(false);
    expect(isReviewPubliclyVisible("public")).toBe(true);
    expect(reviewActivityVisibility("private")).toBe("private");
    expect(reviewActivityVisibility("followers")).toBe("public");
  });

  it("keeps Public/Private copy separate from spoilers", () => {
    expect(REVIEW_VISIBILITY_OPTIONS.map((option) => option.value)).toEqual([
      "public",
      "private",
    ]);
    expect(PRIVATE_REVIEW_BADGE.ariaLabel).toBe("Private Review");
    expect(REVIEW_VISIBILITY_OPTIONS[0]?.helper).toBe(
      "Visible on your profile, book pages, and the Feed."
    );
    expect(REVIEW_VISIBILITY_OPTIONS[1]?.helper).toBe("Visible only to you.");
    expect(PRIVATE_REVIEWS_EMPTY_COPY.title).toBe(
      "You don't have any private reviews yet."
    );
  });
});

describe("canViewerReadReview (RLS predicate)", () => {
  const ownerId = "owner-1";

  it("lets the owner read public and private reviews", () => {
    expect(
      canViewerReadReview({ visibility: "public", ownerId, viewerId: ownerId })
    ).toBe(true);
    expect(
      canViewerReadReview({ visibility: "private", ownerId, viewerId: ownerId })
    ).toBe(true);
  });

  it("lets others read only public reviews", () => {
    expect(
      canViewerReadReview({
        visibility: "public",
        ownerId,
        viewerId: "other-2",
      })
    ).toBe(true);
    expect(
      canViewerReadReview({
        visibility: "private",
        ownerId,
        viewerId: "other-2",
      })
    ).toBe(false);
    expect(
      canViewerReadReview({ visibility: "private", ownerId, viewerId: null })
    ).toBe(false);
  });
});
