import { describe, expect, it } from "vitest";
import {
  mergeClubReplies,
  mergeReconnectClubReplies,
  parseClubReplySort,
  removeClubReply,
  sortClubReplies,
} from "./clubReplyThread";

const reply = (id: string, created_at: string) => ({ id, created_at });

describe("club reply sort + dedup", () => {
  it("sorts by created_at, not arrival order", () => {
    const rows = [
      reply("b", "2026-09-06T12:00:00.000Z"),
      reply("a", "2026-09-06T10:00:00.000Z"),
      reply("c", "2026-09-06T13:00:00.000Z"),
    ];
    expect(sortClubReplies(rows, "newest").map((row) => row.id)).toEqual(["c", "b", "a"]);
    expect(sortClubReplies(rows, "oldest").map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("dedups optimistic + realtime copies by id", () => {
    const existing = [reply("1", "2026-09-06T10:00:00.000Z")];
    const incoming = reply("1", "2026-09-06T10:00:00.000Z");
    const merged = mergeClubReplies(existing, incoming, "newest");
    expect(merged).toHaveLength(1);
  });

  it("keeps sort after a newer reply arrives", () => {
    const existing = [reply("old", "2026-09-06T10:00:00.000Z")];
    const incoming = reply("new", "2026-09-06T12:00:00.000Z");
    expect(mergeClubReplies(existing, incoming, "newest").map((row) => row.id)).toEqual([
      "new",
      "old",
    ]);
    expect(mergeClubReplies(existing, incoming, "oldest").map((row) => row.id)).toEqual([
      "old",
      "new",
    ]);
  });

  it("merges pages without resetting earlier rows", () => {
    const page1 = [reply("a", "2026-09-06T13:00:00.000Z")];
    const page2 = [reply("b", "2026-09-06T11:00:00.000Z")];
    const merged = mergeClubReplies(page1, page2, "newest");
    expect(merged.map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("removes deleted replies by id", () => {
    const rows = [reply("keep", "2026-09-06T10:00:00.000Z"), reply("gone", "2026-09-06T11:00:00.000Z")];
    expect(removeClubReply(rows, "gone").map((row) => row.id)).toEqual(["keep"]);
  });

  it("defaults unknown sort values to newest", () => {
    expect(parseClubReplySort("updated_at")).toBe("newest");
    expect(parseClubReplySort("oldest")).toBe("oldest");
  });

  it("reconnect merge keeps loaded pages and dedupes by id", () => {
    const loaded = [
      reply("page1", "2026-09-06T13:00:00.000Z"),
      reply("page2", "2026-09-06T11:00:00.000Z"),
      reply("optimistic", "2026-09-06T14:00:00.000Z"),
    ];
    const refetch = [
      { id: "optimistic", created_at: "2026-09-06T14:00:00.000Z" },
      { id: "missed", created_at: "2026-09-06T13:30:00.000Z" },
      { id: "page1", created_at: "2026-09-06T13:00:00.000Z" },
    ];
    const merged = mergeReconnectClubReplies(loaded, refetch, "newest");
    expect(merged.map((row) => row.id)).toEqual(["optimistic", "missed", "page1", "page2"]);
  });

  it("reconnect merge drops replies from another discussion", () => {
    const loaded = [
      { id: "keep", created_at: "2026-09-06T10:00:00.000Z", discussion_id: "d1" },
      { id: "stale", created_at: "2026-09-06T11:00:00.000Z", discussion_id: "d0" },
    ];
    const refetch = [
      { id: "fresh", created_at: "2026-09-06T12:00:00.000Z", discussion_id: "d1" },
    ];
    const merged = mergeReconnectClubReplies(loaded, refetch, "oldest", "d1");
    expect(merged.map((row) => row.id)).toEqual(["keep", "fresh"]);
  });
});
