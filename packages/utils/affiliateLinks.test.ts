import { describe, expect, it } from "vitest";
import { AFFILIATE_DISCLOSURE, isbnSearchUrl, validateAffiliateUrl } from "./affiliateLinks";

describe("affiliate links", () => {
  it("accepts https retailer URLs and rejects unsafe schemes", () => {
    expect(validateAffiliateUrl("https://bookshop.org/p/books/example").ok).toBe(true);
    expect(validateAffiliateUrl("javascript:alert(1)").ok).toBe(false);
    expect(validateAffiliateUrl("http://example.com").ok).toBe(false);
    expect(AFFILIATE_DISCLOSURE.toLowerCase()).toContain("affiliate");
  });

  it("builds a Bookshop search URL from ISBN only", () => {
    expect(isbnSearchUrl("9780143127741")).toContain("9780143127741");
    expect(isbnSearchUrl("bad")).toBeNull();
  });
});
