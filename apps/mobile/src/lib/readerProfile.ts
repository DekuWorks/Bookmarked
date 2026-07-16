/**
 * Canonical mobile paths for public reader profiles and libraries.
 * Prefer these helpers over hardcoding `/reader/${username}` in screens.
 */

export function readerProfilePath(username: string): `/reader/${string}` {
  return `/reader/${encodeURIComponent(username.trim())}`;
}

export function readerLibraryPath(username: string): `/reader/${string}/library` {
  return `/reader/${encodeURIComponent(username.trim())}/library`;
}

export function readerLibraryShelfPath(
  username: string,
  shelfSlug: string
): `/reader/${string}/library/${string}` {
  return `/reader/${encodeURIComponent(username.trim())}/library/${encodeURIComponent(shelfSlug)}`;
}
