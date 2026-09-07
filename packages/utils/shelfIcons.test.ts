import { describe, expect, it } from "vitest";
import {
  CUSTOM_COLLECTIONS_HEADING,
  CUSTOM_SHELF_A11Y_LABEL,
  CUSTOM_SHELF_ICON_ASSETS_READY,
  CUSTOM_SHELF_ICON_FALLBACK_FILE,
  CUSTOM_SHELF_ICON_FALLBACK_SRC,
  CUSTOM_SHELF_ICON_FILE,
  CUSTOM_SHELF_ICON_KEYS,
  CUSTOM_SHELF_ICON_PICKER_KEYS,
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  DEFAULT_CUSTOM_SHELF_ICON_SELECTION,
  DEFAULT_SHELF_A11Y_LABEL,
  DEFAULT_SHELF_ICON_FILE,
  DEFAULT_SHELF_ICON_KEY,
  DEFAULT_SHELF_ICON_ORDER,
  getCustomShelfA11yLabel,
  getCustomShelfIconA11yLabel,
  getCustomShelfIconFile,
  getDefaultShelfIconFile,
  getDefaultShelfIconKey,
  isCustomShelfIconKey,
  isValidShelfEmoji,
  parseCustomShelfIconSelection,
  parseCustomShelfIconWrite,
  resolveCustomShelfDisplayIconKey,
  resolveCustomShelfIcon,
  resolveCustomShelfIconKey,
  resolveCustomShelfPickerSelection,
  sanitizeShelfEmoji,
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
    expect(getDefaultShelfIconFile("want_to_read")).toBe("currently-reading.png");
    expect(getDefaultShelfIconFile("currently_reading")).toBe("did-not-finish.png");
    expect(getDefaultShelfIconFile("dnf")).toBe("want-to-read.png");
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
  it("keeps stored keys for existing shelves and one picker bookmark", () => {
    expect(CUSTOM_SHELF_ICON_KEYS).toEqual([
      "custom_icon_1",
      "custom_icon_2",
      "custom_icon_3",
      "custom_icon_4",
      "custom_icon_5",
    ]);
    expect(CUSTOM_SHELF_ICON_PICKER_KEYS).toEqual(["custom_icon_1"]);
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
    expect(resolveCustomShelfDisplayIconKey("custom_icon_4")).toBe("custom_icon_1");
    expect(resolveCustomShelfDisplayIconKey("custom_icon_2")).toBe("custom_icon_1");
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
    expect(getCustomShelfA11yLabel("custom_icon_1")).toBe("Custom Shelf Icon 1");
    expect(getCustomShelfA11yLabel("custom_icon_2")).toBe("Custom Shelf Icon 1");
    expect(getCustomShelfA11yLabel("custom_icon_2", true)).toBe(
      "Custom Shelf Icon 1, Selected"
    );
    expect(getCustomShelfA11yLabel(null)).toBe("Custom Shelf Icon 1");
    expect(CUSTOM_SHELF_A11Y_LABEL.custom_icon_5).toBe("Custom Shelf Icon 5");
  });

  it("documents pending assets and the Bookmarked B-mark fallback file", () => {
    expect(CUSTOM_SHELF_ICON_ASSETS_READY).toBe(false);
    expect(CUSTOM_SHELF_ICON_FALLBACK_FILE).toBe("logo-mark.png");
    expect(CUSTOM_SHELF_ICON_FALLBACK_SRC).toBe("/logo-mark.png");
    expect(getCustomShelfIconFile("custom_icon_3")).toBe("logo-mark.png");
    expect(CUSTOM_SHELF_ICON_FILE.custom_icon_1).toBe("custom-icon-1.png");
    expect(Object.values(DEFAULT_SHELF_ICON_FILE)).not.toContain(
      CUSTOM_SHELF_ICON_FALLBACK_FILE
    );
  });
});

describe("custom shelf emoji", () => {
  it("accepts a single emoji grapheme, including ZWJ and VS16 sequences", () => {
    expect(sanitizeShelfEmoji("📚")).toBe("📚");
    expect(sanitizeShelfEmoji("❤️")).toBe("❤️");
    expect(sanitizeShelfEmoji("❤️").length).toBeGreaterThan(1);
    expect(sanitizeShelfEmoji("👨‍👩‍👧")).toBe("👨‍👩‍👧");
    expect(sanitizeShelfEmoji("🇺🇸")).toBe("🇺🇸");
    expect(isValidShelfEmoji("✨")).toBe(true);
  });

  it("does not use string length === 1 as the validator", () => {
    expect("❤️".length).not.toBe(1);
    expect(isValidShelfEmoji("❤️")).toBe(true);
    expect(isValidShelfEmoji("A")).toBe(false);
    expect("A".length).toBe(1);
  });

  it("rejects letters, paths, blobs, keys, and multiple graphemes", () => {
    expect(sanitizeShelfEmoji("ab")).toBeNull();
    expect(sanitizeShelfEmoji("📚📚")).toBeNull();
    expect(sanitizeShelfEmoji("/assets/shelves/foo.png")).toBeNull();
    expect(sanitizeShelfEmoji("https://example.com/x.png")).toBeNull();
    expect(sanitizeShelfEmoji("blob:https://example.com/x")).toBeNull();
    expect(sanitizeShelfEmoji("custom_icon_1")).toBeNull();
    expect(sanitizeShelfEmoji("")).toBeNull();
    expect(sanitizeShelfEmoji(null)).toBeNull();
  });

  it("resolves existing shelves without an emoji back to the documented key fallback", () => {
    expect(resolveCustomShelfIcon(null)).toEqual(DEFAULT_CUSTOM_SHELF_ICON_SELECTION);
    expect(resolveCustomShelfIcon({ icon_key: null, icon_type: null, icon_emoji: null })).toEqual({
      type: "bookmarked",
      value: "custom_icon_1",
    });
    expect(
      resolveCustomShelfIcon({
        icon_key: "custom_icon_4",
        icon_type: "bookmarked",
        icon_emoji: null,
      })
    ).toEqual({ type: "bookmarked", value: "custom_icon_4" });
    expect(
      resolveCustomShelfPickerSelection({ type: "bookmarked", value: "custom_icon_4" })
    ).toEqual(DEFAULT_CUSTOM_SHELF_ICON_SELECTION);
    expect(
      resolveCustomShelfPickerSelection({ type: "emoji", value: "🌙" })
    ).toEqual({ type: "emoji", value: "🌙" });
    expect(
      resolveCustomShelfIcon({
        icon_key: "custom_icon_2",
        icon_type: "emoji",
        icon_emoji: "🌙",
      })
    ).toEqual({ type: "emoji", value: "🌙" });
  });

  it("writes only approved keys or sanitized emoji", () => {
    expect(parseCustomShelfIconSelection(undefined)).toEqual({
      ok: true,
      value: {
        icon_type: "bookmarked",
        icon_key: "custom_icon_1",
        icon_emoji: null,
      },
    });
    expect(parseCustomShelfIconSelection({ type: "bookmarked", value: "custom_icon_3" })).toEqual({
      ok: true,
      value: {
        icon_type: "bookmarked",
        icon_key: "custom_icon_3",
        icon_emoji: null,
      },
    });
    expect(parseCustomShelfIconSelection({ type: "emoji", value: "🧡" })).toEqual({
      ok: true,
      value: {
        icon_type: "emoji",
        icon_key: "custom_icon_1",
        icon_emoji: "🧡",
      },
    });
    expect(parseCustomShelfIconSelection({ type: "emoji", value: "not-emoji" }).ok).toBe(false);
    expect(
      parseCustomShelfIconSelection({
        icon_type: "emoji",
        icon_emoji: "/nope.png",
      }).ok
    ).toBe(false);
    expect(getCustomShelfIconA11yLabel({ type: "emoji", value: "📚" }, true)).toBe(
      "Emoji 📚, Selected"
    );
  });
});

describe("Custom Collections heading", () => {
  it("uses the exact user-created shelves heading", () => {
    expect(CUSTOM_COLLECTIONS_HEADING).toBe("Custom Collections");
  });
});
