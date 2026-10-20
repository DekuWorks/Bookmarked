import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

describe("NotesBookFilter cover presentation", () => {
  it("lets the shared cover draw the ribbon without clipping the corner", () => {
    const source = readFileSync(
      resolve(root, "src/components/notes/NotesBookFilter.tsx"),
      "utf8"
    );
    expect(source).toContain("<BookCover");
    expect(source).toContain("h-14 w-10 shrink-0 overflow-visible");
    expect(source).not.toContain("overflow-hidden rounded");
  });
});
