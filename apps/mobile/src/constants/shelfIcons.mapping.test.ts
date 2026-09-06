import { describe, expect, it } from "vitest";
import {
  CUSTOM_SHELF_ICON_KEYS,
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  DEFAULT_SHELF_A11Y_LABEL,
  DEFAULT_SHELF_ICON_FILE,
  DEFAULT_SHELF_ICON_KEY,
  parseCustomShelfIconWrite,
  resolveCustomShelfIconKey,
} from "../../../../packages/utils/shelfIcons";

describe("canonical shelf icon mapping", () => {
  it("maps default shelf IDs to logical keys and filenames", () => {
    expect(DEFAULT_SHELF_ICON_KEY.want_to_read).toBe("stack_of_books");
    expect(DEFAULT_SHELF_ICON_FILE.want_to_read).toBe("want-to-read.png");
    expect(DEFAULT_SHELF_ICON_KEY.currently_reading).toBe("open_book");
    expect(DEFAULT_SHELF_ICON_FILE.currently_reading).toBe("currently-reading.png");
    expect(DEFAULT_SHELF_ICON_KEY.dnf).toBe("closed_book");
    expect(DEFAULT_SHELF_ICON_FILE.dnf).toBe("did-not-finish.png");
    expect(DEFAULT_SHELF_ICON_KEY.read).toBe("book_with_sparkle");
    expect(DEFAULT_SHELF_ICON_FILE.read).toBe("finished.png");
  });

  it("uses the required a11y names", () => {
    expect(DEFAULT_SHELF_A11Y_LABEL.want_to_read).toBe("TBR Shelf");
    expect(DEFAULT_SHELF_A11Y_LABEL.currently_reading).toBe("Currently Reading Shelf");
    expect(DEFAULT_SHELF_A11Y_LABEL.dnf).toBe("DNF Shelf");
    expect(DEFAULT_SHELF_A11Y_LABEL.read).toBe("Finished Shelf");
  });

  it("validates custom keys and falls existing shelves back to custom_icon_1", () => {
    expect(CUSTOM_SHELF_ICON_KEYS).toHaveLength(5);
    expect(DEFAULT_CUSTOM_SHELF_ICON_KEY).toBe("custom_icon_1");
    expect(resolveCustomShelfIconKey(null)).toBe("custom_icon_1");
    expect(parseCustomShelfIconWrite("custom_icon_5").ok).toBe(true);
    expect(parseCustomShelfIconWrite("📚").ok).toBe(false);
  });
});
