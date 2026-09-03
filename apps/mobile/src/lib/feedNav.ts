import { withOriginQuery } from "../../../../packages/utils";

export function feedBookHref(bookId: string, extras?: { scroll?: number; section?: string }): string {
  const path = extras?.section
    ? `/book/${bookId}?section=${encodeURIComponent(extras.section)}`
    : `/book/${bookId}`;
  return withOriginQuery(path, { origin: "feed", scroll: extras?.scroll });
}

export function feedComposeHref(scroll?: number, extras?: { repostOf?: string }): string {
  return withOriginQuery("/compose", {
    origin: "feed",
    scroll,
    extra: extras?.repostOf ? { repostOf: extras.repostOf } : undefined,
  });
}

export function feedClubHref(
  clubId: string,
  extras?: { tab?: string; discussionId?: string; scroll?: number }
): string {
  const params = new URLSearchParams();
  if (extras?.tab) params.set("tab", extras.tab);
  if (extras?.discussionId) params.set("discussion", extras.discussionId);
  const qs = params.toString();
  const path = qs ? `/(app)/clubs/${clubId}?${qs}` : `/(app)/clubs/${clubId}`;
  return withOriginQuery(path, { origin: "feed", scroll: extras?.scroll });
}
