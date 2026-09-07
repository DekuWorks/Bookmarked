import { describe, expect, it } from "vitest";
import { getShelfSortOptions, parseShelfSortMode, sortShelfItems } from "./shelfSort";

describe("shelf sort", () => {
  it("keeps progress sort on currently reading only", () => {
    expect(getShelfSortOptions("currently_reading").some((opt) => opt.mode === "progress_updated")).toBe(
      true
    );
    expect(getShelfSortOptions("dnf").some((opt) => opt.mode === "progress_updated")).toBe(false);
    expect(getShelfSortOptions("custom").some((opt) => opt.mode === "progress_updated")).toBe(false);
  });

  it("sorts by title and maps legacy modes", () => {
    const items = [
      { id: "2", created_at: "2026-01-02", books: { title: "Zebra", author: "A" } },
      { id: "1", created_at: "2026-01-01", books: { title: "Apple", author: "B" } },
    ];
    expect(sortShelfItems(items, "title_asc").map((item) => item.id)).toEqual(["1", "2"]);
    expect(parseShelfSortMode("recently_added")).toBe("added_newest");
  });
});
