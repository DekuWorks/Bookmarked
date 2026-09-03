import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";

/** Static-safe book club URLs for GitHub Pages (query params, trailing slash for export). */
export function clubsPath(): string {
  return "/clubs/";
}

export function eventsPath(): string {
  return "/events/";
}

export function clubDetailPath(
  clubId: string,
  options?: {
    tab?: string;
    discussionId?: string | null;
    origin?: string | null;
    scroll?: string | number | null;
  }
): string {
  const params = new URLSearchParams();
  params.set("id", clubId);
  if (options?.discussionId?.trim()) {
    params.set("tab", options.tab?.trim() || "discussions");
    params.set("discussion", options.discussionId.trim());
  } else if (options?.tab?.trim()) {
    params.set("tab", options.tab.trim());
  }
  return withOriginQuery(`/clubs/club/?${params.toString()}`, {
    origin: options?.origin,
    scroll: options?.scroll,
  });
}
