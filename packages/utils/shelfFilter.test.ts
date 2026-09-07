import { describe, expect, it } from "vitest";
import { filterItemsByTitleOrAuthor, shouldApplyHideDnfFilter } from "./shelfFilter";

const items = [
  { books: { title: "The Hobbit", author: "Tolkien" }, dnf: true },
  { books: { title: "Dune", author: "Herbert" }, dnf: false },
];

describe("filterItemsByTitleOrAuthor", () => {
  it("filters by title or author within the given list only", () => {
    expect(filterItemsByTitleOrAuthor(items, "hob").map((item) => item.books?.title)).toEqual([
      "The Hobbit",
    ]);
    expect(filterItemsByTitleOrAuthor(items, "herb").map((item) => item.books?.title)).toEqual([
      "Dune",
    ]);
  });

  it("keeps DNF books — never applies a hide-DNF filter", () => {
    expect(filterItemsByTitleOrAuthor(items, "").every((item) => item.dnf || !item.dnf)).toBe(true);
    expect(filterItemsByTitleOrAuthor(items, "").map((item) => item.books?.title)).toEqual([
      "The Hobbit",
      "Dune",
    ]);
    expect(shouldApplyHideDnfFilter("dnf")).toBe(false);
    expect(shouldApplyHideDnfFilter("want_to_read")).toBe(false);
  });
});
