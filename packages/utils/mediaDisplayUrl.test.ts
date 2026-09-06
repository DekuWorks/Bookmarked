import { describe, expect, it } from "vitest";
import {
  resolveCoverDisplaySource,
  resolveCoverDisplayUrl,
  resolveFeedImageLoading,
  resolveFeedInlineImageSource,
  resolveGiphyInlineSource,
} from "./mediaDisplayUrl";

describe("resolveFeedImageLoading", () => {
  it("eager-loads above-fold / first Feed images and lazy-loads the rest", () => {
    expect(resolveFeedImageLoading(true)).toBe("eager");
    expect(resolveFeedImageLoading(false)).toBe("lazy");
    expect(resolveFeedImageLoading()).toBe("lazy");
  });
});

describe("resolveCoverDisplaySource", () => {
  it("rewrites Open Library -L to -M for thumbs and upgrades http", () => {
    const source = resolveCoverDisplaySource(
      "http://covers.openlibrary.org/b/id/8231856-L.jpg",
      "thumb"
    );
    expect(source.displayUrl).toBe(
      "https://covers.openlibrary.org/b/id/8231856-M.jpg"
    );
    expect(source.fallbackUrl).toBe(
      "https://covers.openlibrary.org/b/id/8231856-L.jpg"
    );
  });

  it("uses -L for book details", () => {
    expect(
      resolveCoverDisplayUrl(
        "https://covers.openlibrary.org/b/isbn/9780141439476-S.jpg",
        "detail"
      )
    ).toBe("https://covers.openlibrary.org/b/isbn/9780141439476-L.jpg");
  });

  it("downsizes Google Books zoom=3 thumbs to zoom=1", () => {
    const source = resolveCoverDisplaySource(
      "https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=3&source=gbs_api",
      "thumb"
    );
    expect(source.displayUrl).toContain("zoom=1");
    expect(source.fallbackUrl).toContain("zoom=3");
  });

  it("leaves ISBNdb covers on https as-is", () => {
    const url = "https://images.isbndb.com/covers/47/62/9780141439476.jpg";
    expect(resolveCoverDisplaySource(url, "thumb")).toEqual({
      displayUrl: url,
      fallbackUrl: null,
    });
  });
});

describe("resolveGiphyInlineSource", () => {
  it("swaps original giphy.gif for the downsized animated file", () => {
    const source = resolveGiphyInlineSource(
      "https://media.giphy.com/media/abc123/giphy.gif"
    );
    expect(source.displayUrl).toBe(
      "https://media.giphy.com/media/abc123/giphy-downsized.gif"
    );
    expect(source.fallbackUrl).toBe(
      "https://media.giphy.com/media/abc123/giphy.gif"
    );
  });

  it("keeps query strings when rewriting API original URLs", () => {
    const source = resolveGiphyInlineSource(
      "https://media1.giphy.com/media/hash/xyz/giphy.gif?cid=demo"
    );
    expect(source.displayUrl).toBe(
      "https://media1.giphy.com/media/hash/xyz/giphy-downsized.gif?cid=demo"
    );
  });

  it("does not rewrite i.giphy.com or already-small variants", () => {
    expect(resolveGiphyInlineSource("https://i.giphy.com/abc123.gif")).toEqual({
      displayUrl: "https://i.giphy.com/abc123.gif",
      fallbackUrl: null,
    });
    expect(
      resolveGiphyInlineSource(
        "https://media.giphy.com/media/abc123/giphy-downsized.gif"
      )
    ).toEqual({
      displayUrl: "https://media.giphy.com/media/abc123/giphy-downsized.gif",
      fallbackUrl: null,
    });
  });
});

describe("resolveFeedInlineImageSource", () => {
  it("only rewrites GIFs", () => {
    const photo = "https://example.supabase.co/storage/v1/object/public/post-images/a.jpg";
    expect(resolveFeedInlineImageSource(photo, false)).toEqual({
      displayUrl: photo,
      fallbackUrl: null,
    });
    expect(
      resolveFeedInlineImageSource(
        "https://media.giphy.com/media/abc123/giphy.gif",
        true
      ).displayUrl
    ).toContain("giphy-downsized.gif");
  });
});
