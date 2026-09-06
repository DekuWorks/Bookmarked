import { describe, expect, it } from "vitest";
import {
  clearedSearchHref,
  createSearchRequestGuard,
  shouldShowSearchClear,
} from "./searchClear";

describe("search clear", () => {
  it("shows the X only when the field has text", () => {
    expect(shouldShowSearchClear("")).toBe(false);
    expect(shouldShowSearchClear("Fourth Wing")).toBe(true);
  });

  it("clears the query and keeps the category", () => {
    expect(clearedSearchHref({ mode: "books" })).toBe("/search/");
    expect(clearedSearchHref({ mode: "people" })).toBe("/search/?cat=people");
    expect(clearedSearchHref({ mode: "clubs" })).toBe("/search/?cat=clubs");
  });

  it("keeps Overview add params when clearing", () => {
    expect(
      clearedSearchHref({
        mode: "books",
        origin: "home_overview_currently_reading",
        shelf: "currently_reading",
      })
    ).toBe("/search/?origin=home_overview_currently_reading&shelf=currently_reading");
  });

  it("ignores a stale Fourth Wing response after clear", () => {
    const guard = createSearchRequestGuard();
    const searchId = guard.next();
    let shown: string | null = "pending";

    guard.invalidate();

    const stale = { title: "Fourth Wing" };
    if (guard.isCurrent(searchId)) {
      shown = stale.title;
    } else {
      shown = null;
    }

    expect(guard.isCurrent(searchId)).toBe(false);
    expect(shown).toBeNull();
  });
});
