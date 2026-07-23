/** Static-safe book club URLs for GitHub Pages (query params, trailing slash for export). */
export function clubsPath(): string {
  return "/clubs/";
}

export function eventsPath(): string {
  return "/events/";
}

export function clubDetailPath(clubId: string): string {
  return `/clubs/club/?id=${encodeURIComponent(clubId)}`;
}
