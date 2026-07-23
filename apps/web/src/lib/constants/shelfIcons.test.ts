import { describe, expect, it } from "vitest";
import {
  getShelfIconConfig,
  getShelfIconsInOrder,
  SHELF_ICON_ORDER,
  SHELF_ICONS,
  sortShelfIconIds,
} from "./shelfIcons";
import { getShelvesInOrder, SHELF_CONFIG } from "./shelves";
import { SHELF_LABELS } from "./shelfLabels";

describe("SHELF_ICON_ORDER", () => {
  it("lists built-in shelves in product order", () => {
    expect(SHELF_ICON_ORDER).toEqual([
      "want_to_read",
      "currently_reading",
      "read",
      "dnf",
    ]);
  });

  it("maps DB read status to finished asset", () => {
    expect(getShelfIconConfig("read").src).toBe("/assets/shelves/finished.png");
    expect(getShelfIconConfig("read").label).toBe("Finished");
  });

  it("maps dnf flag to did-not-finish asset", () => {
    expect(getShelfIconConfig("dnf").src).toBe("/assets/shelves/did-not-finish.png");
    expect(getShelfIconConfig("dnf").label).toBe("Did Not Finish");
  });

  it("does not use emoji in labels", () => {
    for (const config of Object.values(SHELF_ICONS)) {
      expect(config.label).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
      expect(config.accessibilityLabel).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    }
  });
});

describe("getShelfIconsInOrder", () => {
  it("returns configs sorted by sortOrder", () => {
    const orders = getShelfIconsInOrder().map((c) => c.sortOrder);
    expect(orders).toEqual([1, 2, 3, 4]);
  });
});

describe("sortShelfIconIds", () => {
  it("reorders arbitrary input to product order", () => {
    expect(sortShelfIconIds(["dnf", "read", "want_to_read", "currently_reading"])).toEqual(
      SHELF_ICON_ORDER
    );
  });
});

describe("SHELF_CONFIG", () => {
  it("uses Finished label for read status", () => {
    const read = SHELF_CONFIG.find((s) => s.status === "read");
    expect(read?.title).toBe("Finished");
    expect(SHELF_LABELS.read).toBe("Finished");
  });

  it("orders shelves Want to Read → Currently Reading → Finished", () => {
    expect(getShelvesInOrder().map((s) => s.sortOrder)).toEqual([1, 2, 3]);
    expect(getShelvesInOrder().map((s) => s.title)).toEqual([
      "Want to Read",
      "Currently Reading",
      "Finished",
    ]);
  });
});
