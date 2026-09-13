import { describe, expect, it } from "vitest";
import {
  isMissingMoodsColumn,
  isMissingNamedSchema,
  isMissingQuoteGraphicSchema,
  POST_SELECT_CORE,
  POST_SELECT_WITH_QUOTE_GRAPHIC,
} from "./schemaCompat";

describe("schemaCompat", () => {
  it("detects missing quote graphic column and table", () => {
    expect(
      isMissingQuoteGraphicSchema({
        code: "PGRST204",
        message: "Could not find the 'quote_graphic_id' column of 'posts' in the schema cache",
      })
    ).toBe(true);
    expect(
      isMissingQuoteGraphicSchema({
        code: "PGRST205",
        message: "Could not find the table 'public.quote_graphics' in the schema cache",
      })
    ).toBe(true);
    expect(
      isMissingQuoteGraphicSchema({
        code: "42703",
        message: "column posts.quote_graphic_id does not exist",
      })
    ).toBe(true);
    expect(isMissingQuoteGraphicSchema({ code: "42501", message: "permission denied" })).toBe(
      false
    );
  });

  it("detects missing moods column", () => {
    expect(
      isMissingMoodsColumn({
        code: "PGRST204",
        message: "Could not find the 'moods' column of 'reading_sessions' in the schema cache",
      })
    ).toBe(true);
    expect(isMissingNamedSchema({ message: "unrelated" }, ["moods"])).toBe(false);
  });

  it("keeps quote graphic column last so fallback select stays valid", () => {
    expect(POST_SELECT_WITH_QUOTE_GRAPHIC.startsWith(POST_SELECT_CORE)).toBe(true);
    expect(POST_SELECT_CORE.includes("quote_graphic_id")).toBe(false);
  });
});
