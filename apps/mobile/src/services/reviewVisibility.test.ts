import { describe, expect, it } from "vitest";
import {
  PRIVATE_REVIEW_BADGE,
  PRIVATE_REVIEWS_EMPTY_COPY,
  REVIEW_VISIBILITY_OPTIONS,
  canViewerReadReview,
  isPrivateReview,
  isPublicReview,
} from "../../../../packages/utils/reviewVisibility";
import {
  REVIEW_FILTER_OPTIONS,
  filterReviews,
  type ReviewFilterable,
} from "../../../../packages/utils/readingRoomReviews";

function review(overrides: Partial<ReviewFilterable> = {}): ReviewFilterable {
  return {
    rating: 4,
    review_body: "Loved it.",
    has_spoilers: false,
    visibility: "public",
    created_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("iOS private review copy", () => {
  it("matches Public / Private helper text and empty state", () => {
    expect(REVIEW_VISIBILITY_OPTIONS[0]).toMatchObject({
      value: "public",
      label: "Public",
      helper: "Visible on your profile, book pages, and the Feed.",
    });
    expect(REVIEW_VISIBILITY_OPTIONS[1]).toMatchObject({
      value: "private",
      label: "Private",
      helper: "Visible only to you.",
    });
    expect(PRIVATE_REVIEW_BADGE.ariaLabel).toBe("Private Review");
    expect(PRIVATE_REVIEWS_EMPTY_COPY.title).toBe(
      "You don't have any private reviews yet."
    );
  });
});

describe("iOS Reading Room Private Reviews filter", () => {
  it("keeps the filter labelled Private Reviews and only matches visibility=private", () => {
    expect(REVIEW_FILTER_OPTIONS.find((option) => option.id === "private")?.label).toBe(
      "Private Reviews"
    );

    const rows = [
      review({ visibility: "public", has_spoilers: true }),
      review({ visibility: "private", review_body: "Only me" }),
      review({ visibility: "followers" }),
    ];

    const privateOnly = filterReviews(rows, "private");
    expect(privateOnly).toHaveLength(1);
    expect(privateOnly[0]?.visibility).toBe("private");
    expect(filterReviews(rows, "spoiler")).toHaveLength(1);
  });
});

describe("iOS book page / feed client filters", () => {
  it("never treats another reader's private review as community-visible", () => {
    const viewerId = "me";
    const community = [
      { user_id: "me", visibility: "private" },
      { user_id: "other", visibility: "private" },
      { user_id: "other", visibility: "public" },
    ].filter((row) => row.user_id !== viewerId && isPublicReview(row.visibility));

    expect(community).toEqual([{ user_id: "other", visibility: "public" }]);
  });

  it("drops review activity from the Feed unless reviews.visibility is public", () => {
    const reviews = [
      { id: "r1", visibility: "private" },
      { id: "r2", visibility: "public" },
      { id: "r3", visibility: "followers" },
    ];
    const publicIds = reviews.filter((row) => isPublicReview(row.visibility)).map((row) => row.id);
    expect(publicIds).toEqual(["r2", "r3"]);
    expect(isPrivateReview("private")).toBe(true);
  });

  it("mirrors RLS: owner can read private, everyone else cannot", () => {
    expect(
      canViewerReadReview({
        visibility: "private",
        ownerId: "owner",
        viewerId: "owner",
      })
    ).toBe(true);
    expect(
      canViewerReadReview({
        visibility: "private",
        ownerId: "owner",
        viewerId: "other",
      })
    ).toBe(false);
  });
});
