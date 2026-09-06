import { describe, expect, it } from "vitest";
import {
  mergeClubReplies,
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
});
