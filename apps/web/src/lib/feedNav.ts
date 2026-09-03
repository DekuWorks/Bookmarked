import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";

/** Current window scroll for origin=feed return links. */
export function currentFeedScroll(): number {
  if (typeof window === "undefined") return 0;
  return Math.round(window.scrollY);
}

export function feedOriginExtras() {
  return { origin: "feed" as const, scroll: currentFeedScroll() };
}

export function withFeedOrigin(path: string): string {
  return withOriginQuery(path, feedOriginExtras());
}
