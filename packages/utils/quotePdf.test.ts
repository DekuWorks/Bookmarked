import { describe, expect, it } from "vitest";
import {
  QUOTE_PDF_BRAND,
  buildQuotePdfDocument,
  isOwnQuoteExport,
  wrapQuotePdfText,
} from "./quotePdf";

describe("quote PDF", () => {
  it("wraps long unicode lines", () => {
    const lines = wrapQuotePdfText("α".repeat(80), 24);
    expect(lines.length).toBeGreaterThan(2);
    expect(lines.join("")).toContain("α");
  });

  it("builds a multipage branded PDF with unicode", () => {
    const quotes = Array.from({ length: 40 }, (_, index) => ({
      quote: `Line ${index + 1} — café naïve 你好`,
      bookTitle: "Test Book",
      bookAuthor: "Author",
    }));
    const bytes = buildQuotePdfDocument(quotes, { ownerName: "Marcus" });
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain(QUOTE_PDF_BRAND);
    expect(text).toMatch(/\/Count [2-9]/);
    expect(text).toMatch(/4F60|4f60|你好|FEFF/);
  });

  it("refuses exporting another reader's quotes", () => {
    expect(isOwnQuoteExport("user-1", "user-2")).toBe(false);
    expect(isOwnQuoteExport("user-1", "user-1")).toBe(true);
  });
});
