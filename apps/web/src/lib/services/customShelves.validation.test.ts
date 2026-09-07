import { describe, expect, it } from "vitest";
import { CUSTOM_COLLECTIONS_HEADING } from "@/lib/constants/shelfIcons";
import { validateCustomShelfInput } from "./customShelves";

describe("validateCustomShelfInput icons", () => {
  it("accepts an approved Bookmarked key", () => {
    const result = validateCustomShelfInput({
      name: "Beach reads",
      icon_type: "bookmarked",
      icon_key: "custom_icon_3",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.icon_type).toBe("bookmarked");
      expect(result.value.icon_key).toBe("custom_icon_3");
      expect(result.value.icon_emoji).toBeNull();
    }
  });

  it("accepts a sanitized emoji grapheme and rejects paths", () => {
    const emoji = validateCustomShelfInput({
      name: "Night reads",
      icon_type: "emoji",
      icon_emoji: "❤️",
    });
    expect(emoji.ok).toBe(true);
    if (emoji.ok) {
      expect(emoji.value.icon_type).toBe("emoji");
      expect(emoji.value.icon_emoji).toBe("❤️");
    }

    const rejected = validateCustomShelfInput({
      name: "Night reads",
      icon_type: "emoji",
      icon_emoji: "/assets/shelves/foo.png",
    });
    expect(rejected.ok).toBe(false);
  });

  it("defaults missing icon fields to the documented Bookmarked fallback", () => {
    const result = validateCustomShelfInput({ name: "Unlabeled" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.icon_type).toBe("bookmarked");
      expect(result.value.icon_key).toBe("custom_icon_1");
      expect(result.value.icon_emoji).toBeNull();
    }
  });
});

describe("Custom Collections heading", () => {
  it("uses the exact user-created shelves heading", () => {
    expect(CUSTOM_COLLECTIONS_HEADING).toBe("Custom Collections");
  });
});
