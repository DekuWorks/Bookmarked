import { describe, expect, it } from "vitest";
import {
  CUSTOM_SHELF_A11Y_LABEL,
  CUSTOM_SHELF_ICON_ASSETS_READY,
  CUSTOM_SHELF_ICON_FALLBACK_FILE,
  CUSTOM_SHELF_ICON_FILE,
  CUSTOM_SHELF_ICON_KEYS,
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  DEFAULT_SHELF_A11Y_LABEL,
  DEFAULT_SHELF_ICON_FILE,
  DEFAULT_SHELF_ICON_KEY,
  DEFAULT_SHELF_ICON_ORDER,
  getCustomShelfA11yLabel,
  getCustomShelfIconFile,
  getDefaultShelfIconFile,
  getDefaultShelfIconKey,
  isCustomShelfIconKey,
  parseCustomShelfIconWrite,
  resolveCustomShelfIconKey,
  sortDefaultShelfIconIds,
} from "./shelfIcons";

describe("default shelf ID → icon key", () => {
  it("maps stable IDs, not display labels", () => {
    expect(getDefaultShelfIconKey("want_to_read")).toBe("stack_of_books");
    expect(getDefaultShelfIconKey("currently_reading")).toBe("open_book");
    expect(getDefaultShelfIconKey("dnf")).toBe("closed_book");
    expect(getDefaultShelfIconKey("read")).toBe("book_with_sparkle");
  });

  it("maps IDs to approved purple filenames", () => {
    expect(getDefaultShelfIconFile("want_to_read")).toBe("want-to-read.png");
    expect(getDefaultShelfIconFile("currently_reading")).toBe("currently-reading.png");
    expect(getDefaultShelfIconFile("dnf")).toBe("did-not-finish.png");
    expect(getDefaultShelfIconFile("read")).toBe("finished.png");
  });

  it("uses product order TBR → Currently Reading → Finished → DNF", () => {
    expect(DEFAULT_SHELF_ICON_ORDER).toEqual([
      "want_to_read",
      "currently_reading",
      "read",
      "dnf",
    ]);
    expect(sortDefaultShelfIconIds(["dnf", "read", "want_to_read", "currently_reading"])).toEqual(
      DEFAULT_SHELF_ICON_ORDER
    );
  });

  it("uses exact a11y names, not filenames or emoji", () => {
    expect(DEFAULT_SHELF_A11Y_LABEL).toEqual({
      want_to_read: "TBR Shelf",
      currently_reading: "Currently Reading Shelf",
      read: "Finished Shelf",
      dnf: "DNF Shelf",
    });
    for (const label of Object.values(DEFAULT_SHELF_A11Y_LABEL)) {
      expect(label).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
      expect(label.toLowerCase()).not.toContain(".png");
    }
  });

  it("keeps logical keys aligned with every default ID", () => {
    expect(Object.keys(DEFAULT_SHELF_ICON_KEY)).toEqual(
      expect.arrayContaining([...DEFAULT_SHELF_ICON_ORDER])
    );
    expect(Object.keys(DEFAULT_SHELF_ICON_FILE)).toEqual(
      expect.arrayContaining([...DEFAULT_SHELF_ICON_ORDER])
    );
  });
});

describe("custom shelf icon_key", () => {
  it("lists five stable keys", () => {
    expect(CUSTOM_SHELF_ICON_KEYS).toEqual([
      "custom_icon_1",
      "custom_icon_2",
      "custom_icon_3",
      "custom_icon_4",
      "custom_icon_5",
    ]);
    expect(DEFAULT_CUSTOM_SHELF_ICON_KEY).toBe("custom_icon_1");
  });

  it("accepts only approved keys", () => {
    expect(isCustomShelfIconKey("custom_icon_3")).toBe(true);
    expect(isCustomShelfIconKey("want_to_read")).toBe(false);
    expect(isCustomShelfIconKey("📚")).toBe(false);
    expect(isCustomShelfIconKey("/assets/shelves/foo.png")).toBe(false);
    expect(isCustomShelfIconKey(null)).toBe(false);
  });

  it("falls existing shelves with missing/invalid keys back to custom_icon_1", () => {
    expect(resolveCustomShelfIconKey(null)).toBe("custom_icon_1");
    expect(resolveCustomShelfIconKey(undefined)).toBe("custom_icon_1");
    expect(resolveCustomShelfIconKey("")).toBe("custom_icon_1");
    expect(resolveCustomShelfIconKey("emoji")).toBe("custom_icon_1");
    expect(resolveCustomShelfIconKey("custom_icon_4")).toBe("custom_icon_4");
  });

  it("does not randomly assign one of the five on fallback", () => {
    const resolved = [null, undefined, "", "nope"].map(resolveCustomShelfIconKey);
    expect(new Set(resolved)).toEqual(new Set(["custom_icon_1"]));
  });

  it("rejects invalid writes and defaults empty writes to the first key", () => {
    expect(parseCustomShelfIconWrite(undefined)).toEqual({
      ok: true,
      value: "custom_icon_1",
    });
    expect(parseCustomShelfIconWrite(null)).toEqual({
      ok: true,
      value: "custom_icon_1",
    });
    expect(parseCustomShelfIconWrite("custom_icon_2")).toEqual({
      ok: true,
      value: "custom_icon_2",
    });
    expect(parseCustomShelfIconWrite("stack_of_books")).toEqual({
      ok: false,
      error: "Choose an approved shelf icon.",
    });
    expect(parseCustomShelfIconWrite("custom_icon_9")).toEqual({
      ok: false,
      error: "Choose an approved shelf icon.",
    });
  });

  it("uses numbered a11y labels and Selected suffix", () => {
    expect(getCustomShelfA11yLabel("custom_icon_2")).toBe("Custom Shelf Icon 2");
    expect(getCustomShelfA11yLabel("custom_icon_2", true)).toBe(
      "Custom Shelf Icon 2, Selected"
    );
    expect(getCustomShelfA11yLabel(null)).toBe("Custom Shelf Icon 1");
    expect(CUSTOM_SHELF_A11Y_LABEL.custom_icon_5).toBe("Custom Shelf Icon 5");
  });

  it("documents pending assets and the stack-of-books fallback file", () => {
    expect(CUSTOM_SHELF_ICON_ASSETS_READY).toBe(false);
    expect(CUSTOM_SHELF_ICON_FALLBACK_FILE).toBe("want-to-read.png");
    expect(getCustomShelfIconFile("custom_icon_3")).toBe("want-to-read.png");
    expect(CUSTOM_SHELF_ICON_FILE.custom_icon_1).toBe("custom-icon-1.png");
  });
});
