import { describe, expect, it } from "vitest";
import {
  filterTrailBookGroupsByQuery,
  sortTrailBookGroups,
} from "./readingRoomTrail";

const groups = [
  {
    bookTitle: "Zebra",
    bookAuthor: "Ann",
    sessions: [{ created_at: "2026-01-01T00:00:00.000Z" }],
  },
  {
    bookTitle: "Apple",
    bookAuthor: "Zoe",
    sessions: [{ created_at: "2026-06-01T00:00:00.000Z" }],
  },
  {
    bookTitle: "Mango",
    bookAuthor: "Bob",
    sessions: [{ created_at: "2026-03-01T00:00:00.000Z" }],
  },
];

describe("sortTrailBookGroups", () => {
  it("sorts by title and latest session date", () => {
    expect(sortTrailBookGroups(groups, "title_asc").map((g) => g.bookTitle)).toEqual([
      "Apple",
      "Mango",
      "Zebra",
    ]);
    expect(sortTrailBookGroups(groups, "added_newest").map((g) => g.bookTitle)).toEqual([
      "Apple",
      "Mango",
      "Zebra",
    ]);
  });
});

describe("filterTrailBookGroupsByQuery", () => {
  it("matches title or author", () => {
    expect(filterTrailBookGroupsByQuery(groups, "man").map((g) => g.bookTitle)).toEqual([
      "Mango",
    ]);
    expect(filterTrailBookGroupsByQuery(groups, "zoe").map((g) => g.bookTitle)).toEqual([
      "Apple",
    ]);
  });
});
