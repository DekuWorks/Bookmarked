import { describe, expect, it } from "vitest";
import {
  originBackHref,
  originBackLink,
  parseNavOrigin,
  parseNavOriginParam,
  resolveOriginBack,
  restoreSearchHref,
  withOriginQuery,
} from "./navigationOrigin";

describe("parseNavOrigin", () => {
  it("accepts known origins", () => {
    expect(parseNavOrigin("home_overview")).toBe("home_overview");
    expect(parseNavOrigin("feed")).toBe("feed");
    expect(parseNavOrigin("search_people")).toBe("search_people");
  });

  it("rejects unknown or empty values", () => {
    expect(parseNavOrigin("library")).toBeNull();
    expect(parseNavOrigin("")).toBeNull();
    expect(parseNavOrigin(null)).toBeNull();
  });
});

describe("resolveOriginBack", () => {
  it("sends Overview shelf back to Overview, not Library", () => {
    const target = resolveOriginBack("home_overview");
    expect(target?.webHref).toBe("/reading-room/");
    expect(target?.mobileHref).toBe("/?tab=overview");
    expect(target?.label).toBe("Overview");
  });

  it("sends History shelf back to History", () => {
    expect(resolveOriginBack("home_history")?.webHref).toBe("/reading-room/?tab=history");
  });

  it("sends Feed-origin details back to Feed", () => {
    expect(resolveOriginBack("feed")?.webHref).toBe("/feed/");
    expect(resolveOriginBack("feed")?.mobileHref).toBe("/feed");
  });

  it("sends Library-origin shelves back to Library", () => {
    expect(resolveOriginBack("library_shelf")?.label).toBe("Library");
    expect(resolveOriginBack("library_all_books")?.mobileHref).toBe("/library/my-books");
  });
});

describe("originBackHref", () => {
  it("preserves search query when returning to Search People", () => {
    expect(
      originBackHref("search_people", "web", { query: "marcus", scroll: 120 })
    ).toBe("/search/?cat=people&q=marcus&scroll=120");
  });
});

describe("restoreSearchHref", () => {
  it("keeps books category and query", () => {
    expect(restoreSearchHref("search_books", "mobile", { query: "circe" })).toBe(
      "/search?cat=books&q=circe"
    );
  });
});

describe("parseNavOriginParam", () => {
  it("reads the first array value from Expo search params", () => {
    expect(parseNavOriginParam(["home_overview"])).toBe("home_overview");
    expect(parseNavOriginParam("library_shelf")).toBe("library_shelf");
  });
});

describe("originBackLink", () => {
  it("uses Overview when Favorites View All passed home_overview", () => {
    const back = originBackLink("home_overview", "web", {
      href: "/library/",
      label: "← Back to Library",
    });
    expect(back.href).toBe("/reading-room/");
    expect(back.label).toBe("← Back to Overview");
  });

  it("falls back to Library when origin is missing", () => {
    const back = originBackLink(null, "mobile", {
      href: "/library",
      label: "← Back to Library",
    });
    expect(back.href).toBe("/library");
    expect(back.origin).toBeNull();
  });
});

describe("withOriginQuery", () => {
  it("appends origin without inventing empty params", () => {
    expect(withOriginQuery("/library/read/", { origin: "home_overview" })).toBe(
      "/library/read/?origin=home_overview"
    );
    expect(withOriginQuery("/library/read/", { origin: "nope" })).toBe("/library/read/");
  });
});
