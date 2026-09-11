import { describe, expect, it } from "vitest";
import {
  adjustDiscussionReplyCount,
  canEditDiscussion,
  formatReplyCount,
  getClubDiscussionActionPermissions,
  getClubReplyActionPermissions,
  isDiscussionEdited,
  upsertDiscussionCounts,
  validateDiscussionFields,
} from "./clubDiscussionUi";
import { parseBookClubBannerMode, resolveClubBanner } from "./clubBanner";
import { filterClubShelfByCategory, clubBookshelfEmptyMessage } from "./clubBookshelf";

describe("formatReplyCount", () => {
  it("pluralizes correctly", () => {
    expect(formatReplyCount(0)).toBe("0 Replies");
    expect(formatReplyCount(1)).toBe("1 Reply");
    expect(formatReplyCount(2)).toBe("2 Replies");
  });
});

describe("discussion count helpers", () => {
  it("upserts by id and adjusts optimistically", () => {
    const rows = [
      { id: "a", reply_count: 0, latest_activity_at: "2026-01-01T00:00:00.000Z" },
      { id: "b", reply_count: 3, latest_activity_at: "2026-01-02T00:00:00.000Z" },
    ];
    expect(
      upsertDiscussionCounts(rows, {
        id: "a",
        reply_count: 2,
        latest_activity_at: "2026-01-03T00:00:00.000Z",
      })[0]
    ).toMatchObject({ reply_count: 2, latest_activity_at: "2026-01-03T00:00:00.000Z" });

    expect(adjustDiscussionReplyCount(rows, "b", 1)[1].reply_count).toBe(4);
    expect(adjustDiscussionReplyCount(rows, "b", -1)[1].reply_count).toBe(2);
  });
});

describe("reply action permissions", () => {
  it("matches author / host matrix", () => {
    expect(
      getClubReplyActionPermissions({
        viewerId: "u1",
        replyAuthorId: "u1",
        viewerRole: "member",
      })
    ).toEqual({ canEdit: true, canDelete: true, canReport: false, canBlock: false });

    expect(
      getClubReplyActionPermissions({
        viewerId: "host",
        replyAuthorId: "u2",
        viewerRole: "host",
      })
    ).toEqual({ canEdit: false, canDelete: true, canReport: true, canBlock: true });

    expect(
      getClubReplyActionPermissions({
        viewerId: "m1",
        replyAuthorId: "u2",
        viewerRole: "member",
      })
    ).toEqual({ canEdit: false, canDelete: false, canReport: true, canBlock: true });
  });
});

describe("discussion edit permissions", () => {
  it("canEditDiscussion is creator-id only", () => {
    expect(canEditDiscussion("u1", "u1")).toBe(true);
    expect(canEditDiscussion("host", "u1")).toBe(false);
    expect(canEditDiscussion(null, "u1")).toBe(false);
    expect(canEditDiscussion("u1", undefined)).toBe(false);
  });

  it("discussion ••• matrix: host cannot edit others", () => {
    expect(
      getClubDiscussionActionPermissions({
        viewerId: "u1",
        creatorId: "u1",
        viewerRole: "member",
      })
    ).toEqual({ canEdit: true, canDelete: true, canReport: false, canBlock: false });

    expect(
      getClubDiscussionActionPermissions({
        viewerId: "host",
        creatorId: "u2",
        viewerRole: "host",
      })
    ).toEqual({ canEdit: false, canDelete: true, canReport: true, canBlock: true });
  });

  it("isDiscussionEdited prefers edited_at", () => {
    expect(
      isDiscussionEdited({
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        edited_at: null,
      })
    ).toBe(false);

    expect(
      isDiscussionEdited({
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        edited_at: "2026-01-03T00:00:00.000Z",
      })
    ).toBe(true);

    expect(
      isDiscussionEdited({
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      })
    ).toBe(true);
  });

  it("validateDiscussionFields matches create rules", () => {
    expect(validateDiscussionFields("  ", "body")).toEqual({ error: "Title is required." });
    expect(validateDiscussionFields("Title", "  ")).toEqual({ error: "Body is required." });
    expect(validateDiscussionFields("Hi", "Hello")).toEqual({ title: "Hi", body: "Hello" });
  });
});

describe("club banner", () => {
  it("defaults to current_read and prefers cover over custom url", () => {
    expect(parseBookClubBannerMode(null)).toBe("current_read");
    expect(
      resolveClubBanner(
        { banner_mode: "current_read", banner_url: "https://example.com/custom.jpg" },
        { cover_url: "https://example.com/cover.jpg" }
      )
    ).toEqual({
      kind: "image",
      url: "https://example.com/cover.jpg",
      mode: "current_read",
    });
    expect(
      resolveClubBanner({ banner_mode: "custom", banner_url: "https://example.com/b.jpg" }, null)
    ).toEqual({ kind: "image", url: "https://example.com/b.jpg", mode: "custom" });
  });
});

describe("bookshelf filter", () => {
  it("keeps only the selected category", () => {
    const books = [
      { id: "1", category: "current_read" as const },
      { id: "2", category: "suggested" as const },
    ];
    expect(filterClubShelfByCategory(books, "suggested").map((b) => b.id)).toEqual(["2"]);
    expect(clubBookshelfEmptyMessage("suggested")).toMatch(/suggested/i);
  });
});
