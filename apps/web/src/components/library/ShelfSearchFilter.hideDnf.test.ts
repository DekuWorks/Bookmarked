import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

describe("DNF hide control", () => {
  it("is removed from shelf organize UI (DNF books stay visible)", () => {
    const src = readFileSync(resolve(here, "ShelfSearchFilter.tsx"), "utf8");
    expect(src).not.toMatch(/hideDnf/i);
    expect(src).not.toMatch(/Hide did-not-finish/i);
  });
});
