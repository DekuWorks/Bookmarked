import { describe, expect, it } from "vitest";
import { mergeClubReplies, sortClubReplies } from "../../../../packages/utils/clubReplyThread";

describe("mobile club reply merge", () => {
  it("dedups and keeps created_at sort", () => {
    const merged = mergeClubReplies(
      [{ id: "a", created_at: "2026-09-06T10:00:00.000Z" }],
      { id: "a", created_at: "2026-09-06T10:00:00.000Z" },
      "newest"
    );
    expect(merged).toHaveLength(1);
    expect(
      sortClubReplies(
        [
          { id: "b", created_at: "2026-09-06T11:00:00.000Z" },
          { id: "a", created_at: "2026-09-06T09:00:00.000Z" },
        ],
        "oldest"
      ).map((row) => row.id)
    ).toEqual(["a", "b"]);
  });
});
