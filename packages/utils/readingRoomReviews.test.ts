import { describe, expect, it } from "vitest";
import {
  PRIVATE_REVIEWS_EMPTY_COPY,
  isPrivateReview,
} from "./reviewVisibility";
import {
  REVIEW_FILTER_OPTIONS,
  REVIEW_PANEL_COPY,
  buildReviewSharePostBody,
  filterReviews,
  type ReviewFilterable,
} from "./readingRoomReviews";

function review(overrides: Partial<ReviewFilterable> = {}): ReviewFilterable {
  return {
    rating: 4,
    review_body: "Loved it.",
    has_spoilers: false,
    created_at: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("filterReviews", () => {
  const reviews = [
    review({ rating: 5, review_body: null }),
    review({ rating: null, review_body: "Words only" }),
    review({ rating: 4, review_body: "Both", has_spoilers: true, visibility: "public" }),
    review({
      rating: 3,
      review_body: "  ",
      has_spoilers: false,
      visibility: "private",
    }),
  ];

  it("returns all reviews for the all filter", () => {
    expect(filterReviews(reviews, "all")).toHaveLength(4);
  });

  it("filters rating-only reviews", () => {
    const result = filterReviews(reviews, "rating_only");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.rating != null && !r.review_body?.trim())).toBe(true);
  });

  it("filters written-only reviews", () => {
    const result = filterReviews(reviews, "written_only");
    expect(result).toHaveLength(1);
    expect(result[0]?.review_body).toBe("Words only");
  });

  it("filters private reviews", () => {
    const result = filterReviews(reviews, "private");
    expect(result).toHaveLength(1);
    expect(result[0]?.visibility).toBe("private");
    expect(isPrivateReview(result[0]?.visibility)).toBe(true);
  });

  it("labels the private filter Private Reviews", () => {
    expect(REVIEW_FILTER_OPTIONS.find((option) => option.id === "private")?.label).toBe(
      "Private Reviews"
    );
    expect(REVIEW_PANEL_COPY.filterEmpty).toBe("No reviews match this filter.");
    expect(PRIVATE_REVIEWS_EMPTY_COPY.title).toContain("private reviews");
  });

  it("filters spoiler reviews", () => {
    expect(filterReviews(reviews, "spoiler")).toHaveLength(1);
  });
});

describe("buildReviewSharePostBody", () => {
  it("includes rating, review, tags, spoiler warning, and book link", () => {
    const body = buildReviewSharePostBody({
      title: "Dune",
      author: "Frank Herbert",
      rating: 4.5,
      reviewBody: "Epic world-building.",
      feelings: ["mind-bending", "epic"],
      hasSpoilers: true,
      bookUrl: "https://bookmarked.online/book/?id=abc",
    });

    expect(body).toContain("📚 Dune");
    expect(body).toContain("by Frank Herbert");
    expect(body).toContain("⭐ 4.5/5");
    expect(body).toContain("#mind-bending");
    expect(body).toContain("⚠️ Contains spoilers");
    expect(body).toContain("Epic world-building.");
    expect(body).toContain("https://bookmarked.online/book/?id=abc");
  });

  it("labels rating-only shares", () => {
    const body = buildReviewSharePostBody({
      title: "Dune",
      rating: 5,
      reviewBody: null,
      bookUrl: "https://bookmarked.online/book/?id=abc",
    });

    expect(body).toContain("Rating only — no written review.");
  });

  it("labels written-only shares without a star rating", () => {
    const body = buildReviewSharePostBody({
      title: "Dune",
      rating: null,
      reviewBody: "No stars for me.",
      bookUrl: "https://bookmarked.online/book/?id=abc",
    });

    expect(body).toContain("No star rating");
    expect(body).toContain("No stars for me.");
  });
});
