export const FEED_ATTACH_BOOK_PARAM = "attachBook";
export const FEED_ATTACH_GRAPHIC_PARAM = "quoteGraphic";

export const FEED_QUERY_KEYS = {
  home: "home-feed",
  profilePosts: "profile-posts",
  readerActivity: "reader-activity",
} as const;

export type FeedBookAttachment = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
};

export type FeedComposerPrefill = {
  bookId?: string | null;
  quoteGraphicId?: string | null;
};

export function parseFeedComposerPrefill(params: {
  attachBook?: string | string[] | null;
  quoteGraphic?: string | string[] | null;
  bookId?: string | string[] | null;
}): FeedComposerPrefill {
  const first = (value: string | string[] | null | undefined) =>
    (Array.isArray(value) ? value[0] : value)?.trim() || null;
  return {
    bookId: first(params.attachBook) ?? first(params.bookId),
    quoteGraphicId: first(params.quoteGraphic),
  };
}

export function feedComposerSearch(prefill: FeedComposerPrefill): string {
  const params = new URLSearchParams();
  if (prefill.bookId) params.set(FEED_ATTACH_BOOK_PARAM, prefill.bookId);
  if (prefill.quoteGraphicId) params.set(FEED_ATTACH_GRAPHIC_PARAM, prefill.quoteGraphicId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function webFeedComposerHref(prefill: FeedComposerPrefill): string {
  return `/feed/${feedComposerSearch(prefill)}`;
}

export function mobileComposeHref(prefill: FeedComposerPrefill): string {
  return `/compose${feedComposerSearch(prefill)}`;
}
