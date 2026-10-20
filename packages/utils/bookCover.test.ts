import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BOOK_COVER_RADIUS_PX, coverRibbonSize, coverWidthFromClass } from "./bookCover";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("book cover treatment", () => {
  it("uses a tight physical corner instead of a large UI radius", () => {
    expect(BOOK_COVER_RADIUS_PX).toBe(3);
    expect(BOOK_COVER_RADIUS_PX).toBeLessThanOrEqual(4);
    const web = readFileSync(resolve(repoRoot, "apps/web/src/components/books/BookCover.tsx"), "utf8");
    const ios = readFileSync(resolve(repoRoot, "apps/mobile/src/components/BookCover.tsx"), "utf8");
    expect(web).toContain("BOOK_COVER_RADIUS_PX");
    expect(ios).toContain("BOOK_COVER_RADIUS_PX");
    expect(web).not.toContain("rounded-xl");
    expect(ios).not.toContain("rounded-md");
    expect(ios).not.toContain("rounded-none");
  });

  it("scales the existing ribbon token to the cover", () => {
    expect(coverRibbonSize(40)).toBe("small");
    expect(coverRibbonSize(96)).toBe("medium");
    expect(coverRibbonSize(176)).toBe("large");
    expect(coverRibbonSize(36, "small")).toBe("small");
    expect(coverWidthFromClass("w-10 h-14")).toBe(40);
    expect(coverWidthFromClass("w-[56px]")).toBe(56);
  });
});
